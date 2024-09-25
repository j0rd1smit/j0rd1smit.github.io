---
title: "AI based transcription in the browser"
date: 2023-03-26T14:56:33+01:00
publishdate: 2023-03-26T14:56:33+01:00
draft: false
layout: "whisper-based-transcription"
description: "Transcribing audio and video has never been easier, thanks to OpenAI's whisper. Try it out now using a
Javascript-based client-side version of the model."
tags:

- audio
- transcription
- whisper
- AI
- speech-

image: "/cover42.jpg"
draft: false
math: false
use_featured_image: false
featured_image_size: 600x

---

[OpenAI whisper](https://github.com/openai/whisper#whisper) is an automatic speech recognition system that can transform any speech in audio or video file into
written text.
Thanks to [transformers.js](https://github.com/xenova/transformers.js), [ONNX.js](https://github.com/microsoft/onnxruntime/tree/main/js) and [web assembly](https://webassembly.org/), it can run in your browser.
So, you can transcribe audio and video files without uploading them to an external server.
This page will show you some of the cool things you can do with this browser-based version of whisper, such as:

- How to transcribe audio and video files without an external server. (This is a statically generated website, so no
  server is involved.)
- How to interactively search through an HTML5-based video/audio element using the generated transcripts.
- How to export the generated transcripts to a CSV file.

Currently, [ONNX.js has no GPU support](https://github.com/microsoft/onnxruntime/issues/11695), so the transcription process can be a bit slower for the larger models.
However, the tiny and small models' transcription process is still very fast.
Want to try it out yourself?
All you need to do is provide an audio or video file in the form below.

If you find this application useful and would like to support its development, you can buy me a coffee.
