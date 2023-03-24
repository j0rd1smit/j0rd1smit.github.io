const MessageTypes = {
  DOWNLOADING: "DOWNLOADING",
  LOADING: "LOADING",
  RESULT: "RESULT",
  INFERENCE_REQUEST: "INFERENCE_REQUEST",
  TEST: "TEST",
};

const LoadingStatus = {
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
};

const ModelNames = {
  WHISPER_TINY_EN: "openai/whisper-tiny.en",
  WHISPER_TINY: "openai/whisper-tiny",
};

export { MessageTypes, ModelNames, LoadingStatus };
