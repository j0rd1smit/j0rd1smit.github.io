---
title: "Python Dataclass From Scratch"
date: 2022-11-05T10:51:16+01:00
publishdate: 2022-11-06T10:51:16+01:00
tags: []
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---
Python's [data class](https://docs.python.org/3/library/dataclasses.html) functionality has become very popular over the last few years.
Simply adding the `@dataclasses.dataclass` decorator on top of your class generates a `__init__` function, `__repr__` function, etc.
This is extremely convenient since it removes a lot of boilerplate code.
I have been using data classes for years and often tell people about them.
However, recently I showed it to someone new to Python, and they asked how this works under the hood.
To be honest, at that moment, I also had no idea, but I decided to find out by implementing a data class from scratch.



## Python's exec function
After doing some research, I discovered Python has the [exec](https://docs.python.org/3/library/functions.html#exec) function.
This function takes a string with valid python code as input and compiles it into runnable python code at runtime.
For example, we can do the following using the `exec` function:
```python
code = """
def hello_world():
    print("hello world")
"""
scope = {}
exec(code, globals=scope)
scope["hello_world"]()
```
In this example, we write the `hello_world` function in a string.
We then give this string and a scope dictionary as input to the `exec` function.
The `exec` function then executes the python code in the string.
The string defines a new function in this example, which will be stored in the `scope` variable.
Now, we can call the `hello_world` function as we see fit.
The cool thing about this is that the provided string can be dynamically generated and changed as long as it contains valid Python code.
Thus this feature can enable us to do incredible things that might not be possible in other languages. However, with this great power also comes great responsibility. (Thanks, Uncle Ben). Whenever you use the `exec` function, be aware that this might enable someone to run arbitrary code. So always be very careful with this and think about the potential security implementation of this.
Anyway, let's keep this in mind why we will use the `exec` function to implement our version of a data class.



## Generating a init function
Before we implement our custom `generate_init` function, let's first look at the behavior of `dataclasses.dataclass`.
When we define a dataclass using `@dataclasses.dataclass` it generates the following `__init__` function:

```python
# Our example data class
class Point:
    x: int
    y: int
    z: float = 2.0

# The desired generated init function
"""
def __init__(self, x: int, y: int, z: float = 2.0) -> None:
    self.x = x
    self.y = y
    self.z = z
"""
```

So to generate this init function, we first need to know the names of the class properties and their type hint.
Luckily we can access this using the `__annotations__` magic property.
In the above example `Point._annotations__` returns `{'x': <class 'int'>, 'y': <class 'int'>, 'z': <class 'float'>}`.
The only thing we still need is a way to detect whether a property should have a default value.
In the above example, `z` receives the default value `2.0` because the class property `z` has this value.
So, to implement this functionality, we need a way to get the value of a class property if it exists.
We can do this using the [hasattr](https://docs.python.org/3/library/functions.html#hasattr) and [getattr](https://docs.python.org/3/library/functions.html#getattr) functions.
In the above example this give `hasattr(Point, "z")` returns `True` and `getattr(Point, "z")` return `2.0` since `z` has been assigned the value `2.0`, while `hasattr(Point, "x")` returns `False` since `x` has not been assigned a value.
So with these functions, we should have all the required information to dynamically generate a `__init__` function in a string using the following functions:

```python
from typing import Type

def generate_init(cls: Type) -> str:
    code = f"def __init__(self,{generate_init_inputs(cls)}) -> None:\n"
    for name, annotation in cls.__annotations__.items():
        code += f"    self.{name} = {name}\n"

    return code


def generate_init_inputs(cls: Type) -> str:
    input_vars = []
    for name, annotation in cls.__annotations__.items():
        if hasattr(cls, name):
            input_vars.append(f"{name}: {annotation.__name__}={getattr(cls, name)}")
        else:
            input_vars.append(f"{name}: {annotation.__name__}")

    return ",".join(input_vars)
```

We can now generate an `__init__` function based on the type hint and class properties.
However, how do we tell Python that this `__init__` function belongs to this specific class?
An amazing feature of Python is that you can overwrite any class method at any time, including after the creation of the class, using the `setattr` function.
So, we can add the `__init__` method to our `Point` class as follows:


```python
# create the init function
init_code_as_string = generate_init(Point)
scope = {}
exec(init_code_as_string, globals=scope)
# assign the __init__ function
setattr(Point, "__init__", scope["__init__"])

# now this is possible
p1 = Point(1, 2)
p2 = Point(1, 2, 3)
```

## Generating a repr function
Another thing `dataclasses.dataclass` does is that it generates a `__repr__` function.
This function ensures that if your print your data class, the output looks exactly as if you were creating a new instance of your data class.
So if we want to generate such as function, we need the following:
1. We need to know the input order of the arguments in the `__init__` function.
1. We need to know the attribute names.

Getting this information sounds simple because we were the ones that constructed the `__init__` function using our `generate_init` function.
However, this assumption might not hold in the real world since someone could decide to implement the `__init__` function themselves.
In that case, you could do something [inspect.getfullargspec](https://docs.python.org/3/library/inspect.html#inspect.getfullargspec) or [hasattr](https://docs.python.org/3/library/functions.html#hasattr) but this will make our code much more complicated.
So for now, let's consider that out of scope, and let's assume that we are the one that constructs the `__init__` function using our `generate_init`.
In this situation, we could implement the `generate_repr` function as follows:


```python

from typing import Type

def generate_repr(cls: Type) -> str:
    values = ", ".join([f"{name}={{self.{name}}}" for name in cls.__annotations__])
    code = f"""
def __repr__(self) -> str:
    return f"{cls.__name__}({values})"
"""

    return code
```


## Putting it all together
The last thing we need to do is to make our new data class functionality easy to use.
We can do this by creating a decorator function that dynamically adds the `__init__` and `__repr__` to a class definition.
In Python, you can create a class decorator by creating a function that takes as input a class type and return a (new) class type.
We can implement this as follows:


```python
from typing import Any, Type, TypeVar

T = TypeVar("T")


def dataclass(cls: Type[T]) -> Type[T]:
    # add init function
    init_code = generate_init(cls)
    d: dict[str, Any] = {}
    exec(init_code, d)
    setattr(cls, "__init__", d["__init__"])

    # add repr function
    d: dict[str, Any] = {}
    repr_code = generate_repr(cls)
    exec(repr_code, d)
    setattr(cls, "__repr__", d["__repr__"])

    return cls
```
Now we have a minimal working implementation of a dataclass. We can use it is follows:
```python
@dataclass
class Point:
x: int
y: int = 1
z: int = 3


print(Point(1, y=2)) # >>> Point(x=1, y=2, z=3)
print(Point(1, 1, 1)) # >>> Point(x=1, y=1, z=1)
```

## Final thoughts
Implementing a data class from scratch was a fun experience, which opened my eyes to the power of dynamic code generation in Python.
This was one example of what you can do with dynamic code generation, but you can take it much further.
For example, the [dataclass](https://docs.python.org/3/library/dataclasses.html) can optionally implement much more functionality such as `__eq__`, `__hash__`, `__lt__`, and more.
Adding this functionality could also be a fun challenge.
Another option could be to add type validation logic based on the `__annotations__`, which would produce functionality similar to that of [Pydantic](https://pydantic-docs.helpmanual.io/).
And yet another option could be the [FastAPI](https://fastapi.tiangolo.com/) route whereby you use `__annotations__` as additional information for your framework functions.



