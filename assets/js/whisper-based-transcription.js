import { whisperWorkerPath } from "@params";
import { LoadingStatus, MessageTypes, ModelNames } from "./utils.js";
import { Tooltip } from "bootstrap";

/** contants **/
const HIDDEN_CLASS = "d-none";
const GENERATED_TEXT_CLASS = "generated_text";
const START_TIME_ATTR = "data-timestamp-start";
const END_TIME_ATTR = "data-timestamp-end";

/** Form UI elements **/
const FILE_UPLOAD_BTN = document.getElementById("file-input");
const FORM_CONTAINER = document.getElementById("form-container");
const FORM_SUBMIT_BTN = document.getElementById("form-submit-btn");
const MODEL_NAME_SELECTION_INPUT = document.getElementById("model-name-input");

/** Transcription UI elements **/
const VIDEO_PLAYER = document.getElementById("video-player");
const RESULTS_CONTAINER = document.getElementById("results-container");
const TRANSCRIPT_CONTAINER = document.getElementById("transcription-container");
const DOWNLOAD_TRANSCRIPT_BTN = document.getElementById(
  "download-results-as-csv-btn"
);
const CLOSE_TRANSCRIPT_BTN = document.getElementById(
  "close-transcription-container-btn"
);
const PROGRESS_BAR = document.getElementById("transcription-progress-bar");
const PROGRESS_BAR_CONTAINER = document.getElementById(
  "transcription-progress-bar-container"
);
const MODEL_NAME_DISPLAY = document.getElementById("model-name-display");
const LOADING_SPINNER_CONTAINER = document.getElementById(
  "loading-spinner-container"
);
const LOADING_MESSAGE_CONTAINER = document.getElementById(
  "loading-message-container"
);

/** Web worker **/
const WORKER = new Worker(whisperWorkerPath);

// when document is ready add an event listenere for the play time to VIDEO_PLAYER
document.addEventListener("DOMContentLoaded", () => {
  FORM_SUBMIT_BTN.disabled = true;
  /** Form view elements **/
  FORM_SUBMIT_BTN.addEventListener("click", async (event) => {
    event.preventDefault();
    await handleFormSubmission();
  });

  FILE_UPLOAD_BTN.addEventListener("change", (event) => onFormInputChanges());
  MODEL_NAME_SELECTION_INPUT.addEventListener("change", (event) =>
    onFormInputChanges()
  );

  /** transcription view elements **/
  VIDEO_PLAYER.addEventListener("timeupdate", (event) =>
    highlightCurrentChunk(event.target.currentTime)
  );
  CLOSE_TRANSCRIPT_BTN.addEventListener("click", (event) => {
    event.preventDefault();
    showFormView();
  });
  DOWNLOAD_TRANSCRIPT_BTN.disabled = true;
  DOWNLOAD_TRANSCRIPT_BTN.addEventListener("click", (event) => {
    event.preventDefault();
    downloadTranscript();
  });

  /** Web worker **/
  WORKER.onmessage = (event) => {
    const { type } = event.data;
    if (type === MessageTypes.LOADING) {
      handleLoadingMessage(event.data);
    }
    if (type === MessageTypes.DOWNLOADING) {
      LOADING_MESSAGE_CONTAINER.innerHTML = "Downloading model...";
    }
    if (type === MessageTypes.RESULT) {
      handleResultMessage(event.data);
    }
  };
});

function onFormInputChanges() {
  if (isFileUploaded() && isModelNameSelected()) {
    FORM_SUBMIT_BTN.disabled = false;
  } else {
    FORM_SUBMIT_BTN.disabled = true;
  }
}

function highlightCurrentChunk(currentTime) {
  const activeClassName = "chunk-span-active";
  const spans = document.getElementsByClassName(GENERATED_TEXT_CLASS);

  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const start = parseFloat(span.getAttribute(START_TIME_ATTR));
    const end = parseFloat(span.getAttribute(END_TIME_ATTR));

    if (currentTime >= start && currentTime <= end) {
      span.classList.add(activeClassName);
    } else {
      span.classList.remove(activeClassName);
    }
  }
}

function handleLoadingMessage(data) {
  const { status } = event.data;
  showElement(LOADING_SPINNER_CONTAINER);
  showElement(LOADING_MESSAGE_CONTAINER);
  if (status === LoadingStatus.SUCCESS) {
    LOADING_MESSAGE_CONTAINER.innerHTML =
      "Model loaded successfully. Starting transcription...";
  }
  if (status === LoadingStatus.ERROR) {
    LOADING_MESSAGE_CONTAINER.innerHTML =
      "Oops! Something went wrong. Please refresh the page and try again.";
  }
  if (status === LoadingStatus.LOADING) {
    LOADING_MESSAGE_CONTAINER.innerHTML = "Loading model into memory...";
  }
}

function handleResultMessage(data) {
  hideElement(LOADING_SPINNER_CONTAINER);
  hideElement(LOADING_MESSAGE_CONTAINER);

  const { results, isDone, completedUntilTimestamp } = event.data;
  RESULTS_CONTAINER.innerHTML = "";
  for (const result of results) {
    RESULTS_CONTAINER.appendChild(createResultLine(result, isDone));
  }
  if (!isDone) {
    const totalDuration = VIDEO_PLAYER.duration;
    const progress = (completedUntilTimestamp / totalDuration) * 100;
    setProgressBarTo(progress);
  } else {
    DOWNLOAD_TRANSCRIPT_BTN.disabled = false;
    setProgressBarTo(100);

    // wait for 1 second then hide the progress bar
    setTimeout(() => {
      hideElement(PROGRESS_BAR_CONTAINER);
    }, 1000);
  }
}

function createResultLine(result, isDone) {
  const { start, end, text } = result;
  const startRounded = Math.round(start);
  const endRounded = Math.round(end);

  const span = document.createElement("span");
  span.innerText = text;
  span.onclick = () => jumpVideoToTime(start);
  span.setAttribute("class", GENERATED_TEXT_CLASS);
  span.setAttribute(START_TIME_ATTR, `${start}`);
  span.setAttribute(END_TIME_ATTR, `${end}`);

  if (isDone) {
    span.setAttribute("data-bs-toggle", "tooltip");
    span.setAttribute("data-bs-placement", "top");
    span.setAttribute("title", `${startRounded} - ${endRounded}`);
    new Tooltip(span);
  }

  return span;
}

async function handleFormSubmission() {
  if (!isFileUploaded() || !isModelNameSelected()) {
    return;
  }

  const model_name = `openai/${MODEL_NAME_SELECTION_INPUT.value}`;
  const file = FILE_UPLOAD_BTN.files[0];
  const audio = await readAudioFrom(file);

  WORKER.postMessage({
    type: MessageTypes.INFERENCE_REQUEST,
    audio,
    model_name,
  });
  VIDEO_PLAYER.src = URL.createObjectURL(file);
  showTranscriptionView();
}

async function readAudioFrom(file) {
  const sampling_rate = 16000;
  const audioCTX = new AudioContext({ sampleRate: sampling_rate });
  const response = await file.arrayBuffer();
  const decoded = await audioCTX.decodeAudioData(response);
  const audio = decoded.getChannelData(0);
  return audio;
}

function showTranscriptionView() {
  hideElement(FORM_CONTAINER);
  showElement(TRANSCRIPT_CONTAINER);
  setProgressBarTo(0);
  showElement(PROGRESS_BAR_CONTAINER);
  MODEL_NAME_DISPLAY.innerText = `openai/${MODEL_NAME_SELECTION_INPUT.value}`;
  RESULTS_CONTAINER.innerHTML = "";
}

function showFormView() {
  VIDEO_PLAYER.pause();
  hideElement(TRANSCRIPT_CONTAINER);
  showElement(FORM_CONTAINER);
}

function isFileUploaded() {
  if (FILE_UPLOAD_BTN.files.length === 0) {
    return false;
  }
  //TODO: check if file is valid
  return true;
}

function isModelNameSelected() {
  const selectedValue = MODEL_NAME_SELECTION_INPUT.value;

  if (MODEL_NAME_SELECTION_INPUT.value === "") {
    return false;
  }
  const modelName = `openai/${selectedValue}`;
  return Object.values(ModelNames).indexOf(modelName) !== -1;
}

function hideElement(element) {
  if (!element.classList.contains(HIDDEN_CLASS)) {
    element.classList.add(HIDDEN_CLASS);
  }
}

function showElement(element) {
  if (element.classList.contains(HIDDEN_CLASS)) {
    element.classList.remove(HIDDEN_CLASS);
  }
}

function jumpVideoToTime(startTime) {
  if (FILE_UPLOAD_BTN.length === 0) {
    return;
  }
  VIDEO_PLAYER.currentTime = startTime;
  VIDEO_PLAYER.play();
  VIDEO_PLAYER.focus();
}

function setProgressBarTo(progress) {
  PROGRESS_BAR.style.width = `${progress}%`;
  PROGRESS_BAR.innerText = `${Math.round(progress)}%`;
  PROGRESS_BAR.setAttribute("aria-valuenow", `${Math.round(progress)}`);
}

function downloadTranscript() {
  if (!isFileUploaded()) {
    return;
  }

  const headers = ["start", "end", "text"];
  const data = [];
  const spans = document.getElementsByClassName(GENERATED_TEXT_CLASS);
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const start = parseFloat(span.getAttribute(START_TIME_ATTR));
    const end = parseFloat(span.getAttribute(END_TIME_ATTR));
    const text = span.innerText;
    data.push({ start, end, text });
  }
  const fileName = replaceFileExtension(FILE_UPLOAD_BTN.files[0].name, ".csv");
  downloadAsCSV(headers, data, fileName);
}

function downloadAsCSV(headers, data, fileName) {
  const csvDataRows = data.map((row) =>
    headers.map((key) => `"${row[key]}"`).join(",")
  );
  const dataString = headers.join(",") + "\n" + csvDataRows.join("\n");
  const blob = new Blob([dataString], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function replaceFileExtension(fileName, newExtension) {
  let pos = fileName.lastIndexOf(".");
  return fileName.slice(0, pos < 0 ? fileName.length : pos) + newExtension;
}
