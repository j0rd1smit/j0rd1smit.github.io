---
title: "Giving Chatgpt Access to My to Do List"
date: 2023-09-01T22:15:43+02:00
publishdate: 2023-09-01T22:15:43+02:00
tags: []
draft: false
math: false
image: "/TODO.jpg"
use_featured_image: true
featured_image_size: 600x
---

Ever since the release of [Baby AGI](https://github.com/yoheinakajima/babyagi) I have been fascinated with the idea of LLM-based agents.
The inbox of my to-do list was filled with ideas, reading material and other tasks related to this topic ever since.
However, like many people, I have a tendency to quickly fill-up this inbox but cleaning this inbox do with far less enthusiasm.
This got me thinking, todoist (my tool of choice) has an API, ChatGPT knows quite a bit about getting things done, so why not try to let ChatGPT clean do the inbox cleaning for me?

{{< figure src="images/chatgpt_does_not_have_access_to_my_inbox.jpg" caption="ChatGPT does not have access to my inbox" >}}

{{< figure src="images/chatgpt_can_reason_about_if_given the_tasks.jpg" caption="ChatGPT can reason about if given the tasks." >}}

```python
import os
import openai
from todoist_api_python.api import TodoistAPI

openai.api_base = os.environ["OPENAI_API_BASE"]
openai.api_key = os.environ["OPENAI_API_KEY"]
todoist_api = TodoistAPI(os.environ["TODOIST_API_KEY"])

content = """
Do you see a logical group in all the tasks in my inbox? 
The tasks in my inbox are:
"""

inbox_project_id = ...
for tasks in todoist_api.get_tasks():
    if tasks.project_id == inbox_project_id:
        content += "\n- {task}"

completion = openai.ChatCompletion.create(
    engine="gpt-35-turbo",
    messages=[
        {"role": "user", "content": content}
    ],
)
result = completion.choices[0]["message"]["content"]
```

{{< figure src="images/high_level_agent_action_flow.jpg" caption="High level action flow the agent should take to complete the task." >}}

```markdown
Use the following format:
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

```

{{< youtube QttrZMfdi2c >}}
