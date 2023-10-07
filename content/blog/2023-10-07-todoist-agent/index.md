---
title: "What does it take to let ChatGPT manage my Todoist tasks?"
description: ""
date: 2023-10-07T14:14:45+02:00
publishdate: 2023-10-07T14:14:45+02:00
tags: []
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---

I have always been fascinated with the idea of AI-based assistants like Jarvis and Friday.
Recently, this fascination was rekindled when I read about the [Baby AGI project](https://github.com/yoheinakajima/babyagi).
This made me want to implement an LLM agent for myself.
I also have the ideal use case for it.
I'm a big user of [Todoist](https://todoist.com/), but like many Todoist users, I'm better at filling my Todoist inbox than cleaning it up.
Therefore, I would like an AI assistant to help me with this.
For example, it could do the following things for me: group similar tasks, move tasks to the correct project, or even create new ones.
As you can see in the demo video below, I succeeded.

{{< youtube QttrZMfdi2c >}}

Now, you might be wondering how I did this.
It all comes down to the following questions:

- How do you let LLM preform actions?
- What actions does the agent need?
- How do you force the agent to adhere to the REACT framework?
- How do you handle LLMs that makes mistakes?

In this blog, I will some code snippets to explain what is happening.
However, due to space constraints, I will not show all the code.
If you want to see all the code, you can find it [here](https://github.com/j0rd1smit/todoist_react_agent/tree/main).

## How do you let LLM preform actions?

Before diving into the implementation details, we must first discuss some background information about how to give LLMs the ability to perform actions.
The aim of this project was to have an LLM with whom we could have a conversation, and if, during this conversation, we tell the LLM to perform a particular task, it should be able to do so.
For example, if we tell the LLM to clear my inbox, it should tell me it is on it and start performing this task.
Once it is done, it should tell me, and we continue our conversation.
This sounds simple, but it differs from the typical chat process we are used to.
The process now consists of two parts: the conversation part and the background process part.
The conversation part is similar to the chat interface of ChatGPT.
However, the background process part is new.
In this part, the LLM is autonomously reasoning about the task we gave it and performing actions to complete it.
These actions continuously give it new information, which informs it about its progress.
You can think about this process as something like this:

{{< figure src="images/outline-of-desired-process.gif" caption="TODO" >}}

LLMs cannot do this by default since they cannot perform actions independently.
They can only respond to us with generated text.
However, if you ever let an LLM help you debug a program, you know it can tell you what action you should take.
Typically, you perform this action for the LLM; if it does not yet work, you provide it with the resulting error message.
You repeat this process until you solved the problem.
This process works but requires a lot of effort from the user.
Therefore, we want to automate this process.
To do this, we need to let the LLM respond in a parsable format that tells us if it wants to perform a particular action.
A Python script can then parse this response, perform the action for the LLM, and feed the result back into the LLM.
This process allows the LLM to perform actions autonomously.
This prompting technique is called [REACT](https://www.promptingguide.ai/techniques/react) and is the basis of this project.
The system prompt of this framework looks like this:

```text
Use the following format:
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question
```

So, the LLM's response now consists of a `Thought` and `Action` part.
The `Thought` part is where the LLM can explain its thought process, allowing it to reason about its progress and previous observations.
This part is based on the [Chain-of-Thought](https://www.promptingguide.ai/techniques/chain-of-thought) technique and helps to focus the attention of the LLM.
The `Action` part lets the LLM tell us what action it wants to perform.
The LLM still cannot perform this action independently, but at least it can now indicate that it wants to perform a particular action.
A Python script can then parse this action and perform it for the LLM.
The output of this action is then fed back into the LLM as the `Observation` part.
This process can then repeat until the LLM has completed its task.
It will then write the `Final Answer` part, this part contains the text that will be shown to the user.
For example, "I'm done with X." and from here the conversation can continue as usual.
Cool, we now have a way to let the LLM perform actions, but the question remains: how do you implement this?

## TODO: better title

When I started this project, I quickly learned that letting a LLM perform actions is not as easy as it sounds.
Implementing the REACT framework is not that hard, but handling all the edge cases is.
Most interestingly, all these edge cases arise if you are not explicit enough in your system prompt.
It is just like telling a child to clean up its room.
If you are not explicit enough, it will most likely misinterpret your instructions or, even worse, find a way to cheat.
For example, one of my first prompts looked something like this:

```python
def create_system_prompt():
    return """
    You are a getting things done (GTD) ai assistant.
    You run in a loop of Thought, Action, Action Input, Observation.
    At the end of the loop you output an Answer to the question the user asked in his message.
    Use the following format:
    Thought: here you describe your thoughts about process of answering the question.
    Action: the action you want to take next, this must be one of the following: get_all_tasks, get_inbox_tasks or get_all_projects, move_task, create_project.
    Observation: the result of the action
    .. (this Thought/Action/Observation can repeat N times)
    Thought: I now know the final answer
    Final Answer: the final answer to the original input question
    
    Your available actions are:
    - get_all_tasks: Use this when you want to get all the tasks. Return format json list of tasks.
    - get_inbox_tasks: Use this get all open tasks in the inbox. Return format json list of tasks.
    - get_all_projects: Use this when you want to get all the projects. Return format json list of projects.
    - move_task[task_id=X, project_id=Y]: Use this if you want to move task X to project Y. Returns a success or failure message.
    - create_project[name=X]: Use this if you want to create a project with name X. Returns a success or failure message.
    
    Tasks have the following attributes:
    - id: a unique id for the task. Example: 123456789. This is unique per task.
    - description: a string describing the task. Example: 'Do the dishes'. This is unique per task.
    - created: a natural language description of when the task was created. Example: '2 days ago'
    - project: the name of the project the task is in. Example: 'Do groceries'. All tasks belong to a project.
    
    Projects have the following attributes:
    - id: a unique id for the project. Example: 123456789. This is unique per project.
    - name: a string describing the project. Example: 'Do groceries'. This is unique per project.
    - context: a string describing the context of the project. Example: 'Home'. Contexts are unique and each project belongs to a context.
    """
```

You might think the prompt is rather explicit and should work.
Sadly, the LLM found multiple ways to misinterpret this prompt and make mistakes.
Just a small selection of things that went wrong:

- It kept formatting the `move_task` in different ways. For example, `move_task[task_id=X, project_id=Y]`, `move_task[task_id = X, project_id = Y]`, `move_task[X, Y]`, `move_task[task=X, project=Y]`. This made parsing it rather tricky.
- It tried to pick actions that did not exist. For example, `loop through each task in the inbox`.
- and many more...

I tried to fix these issues by making the system prompt more explicit, but that was to no avail.
I decided to take a step back and rethink my approach.
After some reflection, I realized that code is more expressive than text.
Therefore, I decided to define the response format as JSON schema and asked the LLM only to generate JSON that adheres to this schema.
For example, the schema for the `move_task` action looks like this:

```json
{
  "title": "MoveTaskAction",
  "description": "Use this to move a task to a project.",
  "type": "object",
  "properties": {
    "type": {
      "title": "Type",
      "enum": [
        "move_task"
      ],
      "type": "string"
    },
    "task_id": {
      "title": "Task Id",
      "description": "The task id obtained from the get_all_tasks or get_all_inbox_tasks action.",
      "pattern": "^[0-9]+$",
      "type": "string"
    },
    "project_id": {
      "title": "Project Id",
      "description": "The project id obtained from the get_all_projects action.",
      "pattern": "^[0-9]+$",
      "type": "string"
    }
  },
  "required": [
    "type",
    "task_id",
    "project_id"
  ]
}
```

You might think that it might be way more work to create these type of schemas than to write a system prompt.
However, thanks to the [Pydantic](https://pydantic-docs.helpmanual.io/) library, this is not the case.
Pydantic has a `schema_json` method that automatically generates this schema for you.
So, in practice you will only write the following code:

```python
class MoveTaskAction(pydantic.BaseModel):
    """Use this to move a task to a project."""

    type: Literal["move_task"]
    task_id: str = pydantic.Field(
        description="The task id obtained from the"
        + " get_all_tasks or get_all_inbox_tasks action.",
        regex=r"^[0-9]+$",
    )
    project_id: str = pydantic.Field(
        description="The project id obtained from the get_all_projects action.",
        regex=r"^[0-9]+$",
    )
```

I also ended up defining a JSON schema and Pydantic model for the general react response format.
This looked something like:

```python
...
class ReactResponse(pydantic.BaseModel):
    """The expected response from the agent."""

    thought: str = pydantic.Field(
        description="Here you write your plan to answer the question. You can also write here your interpretation of the observations and progress you have made so far."
    )
    action: Union[
        GetAllTasksAction,
        GetAllProjectsAction,
        CreateNewProjectAction,
        GetAllInboxTasksAction,
        MoveTaskAction,
        GiveFinalAnswerAction,
    ] = pydantic.Field(
        description="The next action you want to take. Make sure it is consistent with your thoughts."
    )
...
```

Besides generating a more explicit schema, this approach also has the following benefits.
Firstly, the part of the prompt I need to write is now way smaller.
Almost, everything is now generated by Pydantic.
I only need to write the general context part of the prompt.

```python
def create_system_prompt():
    return f"""
    You are a getting things done (GTD) agent.
    You have access to multiple tools.
    See the action in the json schema for the available tools.
    If you have insufficient information to answer the question, you can use the tools to get more information.
    All your answers must be in json format and follow the following schema json schema:
    {ReactResponse.schema()}
    
    If your json response asks me to preform an action, I will preform that action.
    I will then respond with the result of that action.

    Do not write anything else than json!
    """
```

## TODO

```python
def create_system_prompt():
    return """
    You are a getting things done (GTD) agent.
    You have access to multiple tools.
    See the action in the json schema for the available tools.
    If you have insufficient information to answer the question, you can use the tools to get more information.
    All your answers must be in json format and follow the following schema json schema:
    {react_model.schema()}
    
    If your json response asks me to preform an action, I will preform that action.
    I will then respond with the result of that action.

    Do not write anything else than json!
    """
```

Surprisingly, the default REACT system prompt leaves a lot of room for the LLM agent to make mistakes.
For example,

Surprisingly, it also leaves a lot of room for cheating.
One time an LLM told me it wanted to preform the action: `Loop through all tasks in the inbox and move them`.
It seems like a logical higher level goal, but it was not one of the actions I defined in the system prompt.

## How do you handle LLMs that makes mistakes?

TODO

## Wrap up

TODO
