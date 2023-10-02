---
title: "Obsidian Copilot"
date: 2023-09-30T15:53:49+02:00
publishdate: 2023-09-30T15:53:49+02:00
tags: []
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---

I have been using GitHub Copilot daily ever since I got access to it.
I often suffer from the white page syndrome, where I just don't know how to start a new project.
For these cases, Copilot is a great help since it will keep suggesting possible code snippets which I actively use as starting points.
Recently, I have been using Obsidian a lot for note-taking.
However, within Obsidian, I often encounter the same white page problem.
So, I wondered what would it take to implement a Copilot-like plugin for Obsidian?
It turns out that all comes down to three questions:

- How do we obtain completions?
- How do ensure that the obtains are in type of completions we expect?
- How do design an maintainable software architecture for such a plugin?

## Obtaining completions

The thing that makes Copilot so powerful is that its predictions take the text before and after your cursor into account.
If you know a bit about transformers, you might think that is a bit strange since autoregressive transformers like GPT-3 only take previous tokens into account in their predictions.
So, how do you force a these autoregressive transformer-based model to take the text before and after the cursor into account in its prediction?
This problem is solvable with some clever, prompt engineering.
We tell the model that we give it some text with the format `<text_before_cursor> <mask/> <text_after_cursor>,` and its task is to respond with the most logical words that can replace the `<mask/>`.
In the plugin, we do this using the following system prompt:

```markdown
Your job is to predict the most logical text that should be written at the location of the `<mask/>`.
Your answer can be either code, a single word, or multiple sentences.
Your answer must be in the same language as the text that is already there.
Your response must have the following format:
THOUGHT: here you explain your reasoning of what could be at the location of `<mask/>`
ANSWER: here you write the text that should be at the location of `<mask/>`
```

We then provide the model with the text before and after the cursor, which might look something like this:

```markdown
# The Softmax <mask/>
The softmax function transforms a vector into a probability distribution such that the sum of the vector is equal to 1
```

The model will then response with something like this:

```markdown
THOUGHT: `<mask/>` is located inside a Markdown headings. The header already contains the text "The Softmax" contains so my answer should be coherent with that. The text after `<mask/>` is about the softmax function, so the title should reflect this.
ANSWER: function
```

The text after `THOUGHT:` allows the model to reason a bit about the context around the cursor before writing the answer in the `ANSWER:` section.
This is a prompt engineering trick called [Chain-of-Thought](https://www.promptingguide.ai/techniques/cot ).
The idea here is that if a model explains its reasoning, it will be more likely to write a coherent answer since it give the attention mechanism more guidance.
For our use case, this works remarkably well.
We are mainly interested in the `ANSWER:` section since contains the actual completion.
Thanks to the `ANSWER:` prefix, we can easily extract this text using regex, which is exactly what we do in the plugin.

### Making the model context-aware

The setup above already works quite well, however, its prediction were often quite generic.
We humans expect different type of completions in different cursor locations.
For example:

- If the cursor is inside a Python code block, we expect a completion with Python code.
- If the cursor is inside a math block, we expect a completion with latex formulas.
- If the cursor is inside a list, we expect a new list item.
- If the cursor is inside a heading, we expect a new heading that represents the paragraph's content.
- Etc.

You can probably think of many more examples and expectations.
Encoding all these expectation in the system prompt would make it very long and complex, and thus costly.
Instead, it easier to use a few-shot example approach.
In this approach, we give the model some example input and output pairs that implicitly show the model what we expect in the response for the given context.

TODO: Example image.

The nice thing about this approach is that it does not need to be static.
So, what we do is that we detect the current location of the cursor and use that to select the correct few-shot example.
For example, if the cursor is inside a Python code block, we select a few-shot example that contains Python code.
Is the cursor inside a math block, we select a few-shot example that contains latex formulas, etc.
This way, we can make the model context-aware without having to encode all the context into 1 long system prompt.

A nice side effect of this few shot example approach is that it also give the users the ability to customize the type of completions they expect.
Maybe a user want the model to write in their native language?
Or do the user want the model generate TODO list tasks in their specific style?
All they need to do is write an example input and model response for a given context and the model will learn to generate tasks in your style.
This makes the model very flexible and customizable to the user's needs.

## Software engineering part

### Plugin architecture
