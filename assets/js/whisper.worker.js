import { createModelLoader } from "./modelFactories.js";
import { MessageTypes, ModelNames } from "./utils.js";

const modelLoaders = {};
for (const model_name of Object.values(ModelNames)) {
  modelLoaders[model_name] = createModelLoader(model_name);
}

self.addEventListener("message", async (event) => {
  const { type, audio, model_name } = event.data;
  if (type === MessageTypes.INFERENCE_REQUEST) {
    await transcribe(audio, model_name);
  }
});

async function transcribe(audio, model_name) {
  // check if model_name is not in modelLoaders
  sendLoadingMessage("loading", "");

  if (!modelLoaders[model_name]) {
    console.log("Model not found");
    sendLoadingMessage("error", "Model not found");
    return;
  }

  const pipeline = await modelLoaders[model_name]({
    callback_function: load_model_callback,
  });
  sendLoadingMessage("success");

  const stride_length_s = 5;
  const generationTracker = new GenerationTracker(pipeline, stride_length_s);
  await pipeline(audio, {
    top_k: 0, // TODO: make this configurable via request
    do_sample: false, // TODO: make this configurable via request
    chunk_length_s: 30, // TODO: make this configurable via request
    stride_length_s: stride_length_s, // TODO: make this configurable via request
    return_timestamps: true,
    callback_function:
      generationTracker.callbackFunction.bind(generationTracker),
    chunk_callback: generationTracker.chunkCallback.bind(generationTracker),
  });
  generationTracker.sendFinalResult();
}

async function load_model_callback(data) {
  const { status } = data;
  if (status === "progress") {
    const { file, progress, loaded, total } = data;
    sendDownloadingMessage(file, progress, loaded, total);
  }
  if (status === "done") {
    // Do nothing
  }
  if (status === "loaded") {
    // Do nothing
  }
}

function sendLoadingMessage(status, message) {
  self.postMessage({
    type: MessageTypes.LOADING,
    status,
    message,
  });
}

function sendDownloadingMessage(file, progress, loaded, total) {
  self.postMessage({
    type: MessageTypes.DOWNLOADING,
    file,
    progress,
    loaded,
    total,
  });
}

class GenerationTracker {
  constructor(pipeline, stride_length_s) {
    this.pipeline = pipeline;
    this.stride_length_s = stride_length_s;
    this.chunks = [];
    this.time_precision =
      pipeline.processor.feature_extractor.config.chunk_length /
      pipeline.model.config.max_source_positions;
    this.results = [];
    this.callbackFunctionCounter = 0;
  }

  sendFinalResult() {
    createResultMessage(this.results, true);
  }

  callbackFunction(beams) {
    this.callbackFunctionCounter += 1;
    if (this.callbackFunctionCounter % 10 !== 0) {
      return;
    }

    const bestBeam = beams[0];
    const text = this.pipeline.tokenizer.decode(bestBeam.output_token_ids, {
      skip_special_tokens: true,
    });
    const result = {
      text,
      start: this.getLastChuckTimestamp(),
      end: undefined,
    };
    createResultMessage(
      this.results.concat(result),
      false,
      this.getLastChuckTimestamp()
    );
  }

  chunkCallback(data) {
    this.chunks.push(data);
    const [text, { chunks }] = this.pipeline.tokenizer._decode_asr(
      this.chunks,
      {
        time_precision: this.time_precision,
        return_timestamps: true,
        force_full_sequences: false,
      }
    );
    this.results = chunks.map(this.processChunk.bind(this));
    createResultMessage(this.results, false, this.getLastChuckTimestamp());
  }

  getLastChuckTimestamp() {
    if (this.results.length === 0) {
      return 0;
    }
    return this.results[this.results.length - 1].end;
  }

  processChunk(chunk) {
    const { text, timestamp } = chunk;
    const [start, end] = timestamp;

    return {
      text,
      start,
      end: end || start + 0.9 * this.stride_length_s,
    };
  }
}

function createResultMessage(results, isDone, completedUntilTimestamp) {
  self.postMessage({
    type: MessageTypes.RESULT,
    results,
    isDone,
    completedUntilTimestamp,
  });
}
