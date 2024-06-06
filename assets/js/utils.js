const MessageTypes = {
  DOWNLOADING: "DOWNLOADING",
  LOADING: "LOADING",
  RESULT: "RESULT",
  RESULT_PARTIAL: "RESULT_PARTIAL",
  INFERENCE_REQUEST: "INFERENCE_REQUEST",
  INFERENCE_DONE: "INFERENCE_DONE",
};

const LoadingStatus = {
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
};

const ModelNames = [
  "distil-whisper/distil-small.en",
  "distil-whisper/distil-medium.en",
  "distil-whisper/distil-large-v3",
  "Xenova/whisper-tiny.en",
  "Xenova/whisper-tiny",
  "Xenova/whisper-base.en",
  "Xenova/whisper-base",
  "Xenova/whisper-small.en",
  "Xenova/whisper-small",
  "Xenova/whisper-medium",
  "Xenova/whisper-medium.en",
  "Xenova/whisper-large",
];

export { MessageTypes, ModelNames, LoadingStatus };
