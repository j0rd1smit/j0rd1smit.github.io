---
title: "How to pass data to PyTest fixtures from the CLI."
date: 2022-06-29T21:45:20+02:00
publishdate: 2022-06-29T21:45:20+02:00
tags: []
image: "/cover.png"
draft: true
math: false
---
A short while ago, I needed to create some high-level smoke tests that tested whether an API I deployed was working as intended.
The test cases were relatively straightforward to write.
However, the tricky part was that I wanted to use these test cases for both my stage and production deployment, which of course, have different URLs.
At first, I was trying to solve the problem by passing the deployment URL via environment variables.
Although this worked, it didn't feel like the right solution since it felt rather complicated, and it didn't work nicely in scenarios where someone forgot to set the environment variables.

So I went searching for a better solution. Eventually, I found a solution that allows me to pass the URL parameter using the following command: `pytest --url SOME_VALUE`.
It works using the following code:

```python
from typing import Optional

import pytest


def pytest_addoption(parser):
    parser.addoption("--url", action="store")


@pytest.fixture(scope="session")
def url(request: pytest.FixtureRequest) -> Optional[str]:
    url_value = request.config.option.url
    if url_value is None:
        pytest.skip()
    return url_value
```
In this code snippet, I used the `pytest_addoption` function in the top-level `conftest.py` file to add the `--url` parameter to the `pytest` CLI.
Now, the optional value of the url parameter becomes available in the `pytest.FixtureRequest` config options, which means we can expose it as a PyTest fixture.


What I really like about this solution is that works with both the `pytest --url SOME_URL` and `pytest` command.
This works because if the `url` parameter is not defined, all test cases that depend on the `url` fixture will be skipped due to the `pytest.skip()`.
