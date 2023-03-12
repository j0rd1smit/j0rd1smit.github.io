---
title: "Poetry cheatsheet"
description: "Keep forgetting the CLI commands for Poetry? This cheatsheet will help you."
date: 2022-07-27T20:05:21+02:00
publishdate: 2022-07-27T20:05:21+02:00
tags:
- poetry
- python
- dependency management
- virtual environment
- CLI
image: "/cover.jpg"
use_featured_image: false
featured_image_size: 200x
draft: false
math: false
---


[Poetry](https://python-poetry.org/) is an awsome dependency management and virtual environment management tool for Python.
I use it quite often in my day-to-day work.
If you are a PIP or Conda user, you might find that Poetry's CLI is slightly different from what you are used to.
So to help you get started I created overview of the command I use most often. 


## Project creation
{{<table "table table-striped table-bordered">}}

| Command                       | Description                                                                                                                                                                               |
| ----------------------------- |-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `poetry new my-package`       | This creates a new project. This new project will contain a new `pyproject.toml` and `readme.md` files. It also sets up the folder structure for your Python package and your unit tests. |
| `poetry new --src my-package` | This also creates a new project but with the `src` project layout.                                                                                                                        |
| `poetry init`                 | This creates a new `pyproject.toml` file without creating an entire folder structure.                                                                                                     | 

{{</table>}}

## Dependancy management
{{<table "table table-striped table-bordered">}}

| Command                                                       | Description                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------- |----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `poetry install`                                              | This installs **all** the dependencies that are specified in the `poetry.lock` file. Thus, if you change your `pyproject.toml` but you do **not** update your `poetry.lock` file it will install the dependencies as specified in the (outdated) `poetry.lock` file.  If there is no `poetry.lock` file, it will automatically first run the `poetry lock` command to create a `poetry.lock` file. | 
| `poetry install --no-dev`                                     | This only installs the main dependencies and does not install the development dependencies. Your dev dependencies are dependencies that you don't need to run the application such as `pytest`, `mypy`, etc. So, if you don't install them your final application will take up less space.                                                                                                         |
| `poetry install --remove-untracked `                          | Removes all dependencies that are installed in your venv but are no longer specified in your `poetry.lock` file.                                                                                                                                                                                                                                                                                   |
| `poetry install --extras "NAME_1 NAME_N`                      | This installs the optional dependencies `NAME_1` and `NAME_N`.                                                                                                                                                                                                                                                                                                                                     |
| `poetry install --no-root`                                    | This installs your projects dependencies but doesn't install your package to the global name space in the venv. Thus, you can no longer directly import the package you made.                                                                                                                                                                                                                      |
| `poetry update`                                               | Update **all** the dependencies in the `poetry.lock` file to their latest version.                                                                                                                                                                                                                                                                                                                 |
| `poetry update NAME_1 NAME_2`                                 | Updates **only** `NAME_1` and `NAME_N` in the `poetry.lock` file to their latest version.                                                                                                                                                                                                                                                                                                          |
| `poetry add NAME_1 NAME_2`                                    | Adds `NAME_1` and `NAME_N` to the `poetry.lock` file and installs them into the venv. You can also add constrains like `@^2.0.5`, `>=2.0.5` or `<=2.0.5`.                                                                                                                                                                                                                                          |
| `poetry add ../path/to/other/folder/with/pyproject.toml`      | Adds another poetry project as a **local** dependency. This is quite usefull for mono-repos.                                                                                                                                                                                                                                                                                                       |
| `poety remove NAME_1 NAME_2`                                  | Uninstalls dependency `NAME_1` and `NAME_N` from the VENV. Also removes them from the `poetry.lock` file.                                                                                                                                                                                                                                                                                          |
| `poetry lock`                                                 | If you have updated the dependencies in the `pyproject.toml` file manually, you can use this command to update the `poetry.lock` file.                                                                                                                                                                                                                                                             |
| `poetry export -f requirements.txt --output requirements.txt` | Export the lock file in the traditional `requirements.txt` file format.                                                                                                                                                                                                                                                                                                                            |

{{</table>}}

## Virtual environment

{{<table "table table-striped table-bordered">}}

| Command                                     | Description                                                                                                                                                                       |
| ------------------------------------------- |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `poetry run CMD`                            | Run a command inside the virtual environment without activating the VENV. For example, CMD can be `python main.py`, `black`, `pytest`, etc.                                       |
| `poetry shell`                              | Activates the virtual environment. Similar to `conda activate name` or `source venv/bin/activate`.                                                                                |
| `poetry env use path/to/pythonN`            | Tell poetry to use the python version at `path/to/pythonN` as a basis for the VENV. You need this if you want to use a specific python version for VENV, e.g. `py3.9` or `py3.10`. |
| `poetry env info --path`                    | This gives the absolute path to the virtual environment. Useful if your IDEA needs a path to your python interpreter.                                            |
| `poetry env remove /full/path/to/python`    | This deletes the virtual environment.                                                                                                                                             |
| `poetry config virtualenvs.in-project true` | Tell poetry to save the VENV dir in the same directory as the `pyproject.toml`.                                                                                                   |

{{</table>}}

For a more complete overview I recommend you to read the [Poetry documentation](https://python-poetry.org/docs/cli/).