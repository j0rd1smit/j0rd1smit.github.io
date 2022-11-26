---
title: "Autograd Engine From Scratch"
date: 2022-11-06T16:37:27+01:00
publishdate: 2022-11-06T16:37:27+01:00
tags: []
draft: false
math: true
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---

TODO: post


## Differentiation refresher

{{<table "table table-striped table-bordered">}}

| Name                         |    Function     |                                                                         Derivative                                                                          |
|------------------------------|:---------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------:|
| Definition                   |        -        |                                                             $\frac{\partial L}{\partial L} = 1$                                                             |
| (Unrelated) constant rule    |     $L = c$     |                                                             $\frac{\partial L}{\partial x} = 0$                                                             |
| Sum rule                     | $L = x_1 + x_2$ |                                        $\frac{\partial L}{\partial x_1} = 1$, $\frac{\partial L}{\partial x_2} = 1$                                         |
| Multiplication rule          | $L = x_1 * x_2$ |                                      $\frac{\partial L}{\partial x_1} = x_2$, $\frac{\partial L}{\partial x_2} = x_1$                                       |
| Constant multiplication rule |    $L = c*x$    |                                                             $\frac{\partial L}{\partial x} = c$                                                             |
| Power rule                   |  $L = c * x^n$  |                                                      $\frac{\partial L}{\partial x} = c * n * x^{n-1}$                                                      |
| Chain rule                   |        -        | $\frac{\partial L}{\partial x} = \frac{\partial L}{\partial x} \frac{\partial y}{\partial y} = \frac{\partial L}{\partial y} \frac{\partial x}{\partial y}$ |
| Tanh                         |  $L = tanh(x)$  |                                                      $\frac{\partial L}{\partial x} = 1 - (tanh(x))^2$                                                      |

{{</table>}}


## Back propagation 
$$
x_1 = 3
$$
$$
x_2 = 4
$$
$$
x_3 = x_1 * x_2 = 12
$$
$$
x_4 = 5
$$
$$
x_5 = x_3 + x_4
$$
$$
x_6 = 2
$$
$$
L = 34
$$

{{< figure src="images/computational_graph.png" caption="A visualization of the computational graph." >}}

The goal is to find the gradients with respect to $L$ for every node in this computational graph. 
Calculating the gradients for $x_1$ and $x_2$ looks quite difficult.
However, find the calculating gradients for $x_5$ and $x_6$ is a bit easier since we by definition that they should be:
$$
\frac{\partial L}{\partial L} = 1
$$
$$
\frac{\partial L}{\partial x_5} = x_6 = 2
$$
$$
\frac{\partial L}{\partial x_6} = x_5 = 17
$$

{{< figure src="images/computation_graph_with_gradients_partial_1.jpg" caption="A visualization of the computational graph and the gradients so far." >}}

{{< figure src="images/computation_graph_with_gradients_partial_2.jpg" caption="A visualization of the computational graph and the gradients so far." >}}

{{< figure src="images/computation_graph_with_gradients.png" caption="A visualization of the computational graph with all gradients." >}}

```python
graph = create_computation_graph()
leaf_node.grad = 1

for node in reversed_topological_order(graph, leaf_node):
    node.backwards(node.grade)
```

## title
What do we want to have?
```python
x_1 = Value(1)
x_2 = Value(2)
l = x_1 + x_2

l.backwards()
assert l.grad == 1
assert x_1.grad == 2
assert x_2.grad == 1
```

```python
Backwards = Callable[[float], None]

def _noop_grad(_: float) -> None:
    pass

class Value:
    def __init__(
        self,
        data: float,
        children: Optional[set[Value]] = None,
        _backwards: Backwards = _noop_grad,
    ):
        self.data = data
        self.grad = 0.0
        self.children = set() if children is None else children
        self._backwards = _backwards

    def __add__(self, other: Value) -> Value:
        def _backward(grad_parent: float) -> None:
            self.grad += grad_parent
            other.grad += grad_parent

        return Value(
            self.data + other.data,
            children={self, other},
            _backwards=_backward,
        )
    
    ...
```
The `data` attribute is the actual value of this variable.
The `childeren` attribute are the previous nodes in the computational graph that created this node.
The `_backwards` attribute is a function that takes as input the gradient of the 

```python
class Value:
    ...
    
    def __mul__(self, other: Value) -> Value:
        def _backward(grad_parent: float) -> None:
            self.grad += other.data * grad_parent
            other.grad += self.data * grad_parent
    
        return Value(
            self.data * other.data,
            children={self, other},
            _backwards=_backward,
        )
    
    ...
```

```python
class Value:
    ...

    def __pow__(self, power: float) -> Value:
        assert isinstance(power, (int, float)), "Only support int/float powers"
    
        def _backward(grad_parent: float) -> None:
            self.grad += (power * self.data ** (power - 1)) * grad_parent
    
        return Value(
            self.data**power, children={self}, _backwards=_backward, _op=f"^{power}"
        )
    
    ...
```

```python
class Value:
    ...

    def backward(self) -> None:
        self.grad = 1
    
        for v in find_reversed_topological_order(self):
            v._backwards(v.grad)
    
    ...

def find_reversed_topological_order(root: Value) -> list[Value]:
    visited = set()
    topological_order = []

    def _depth_first_search(node: Value):
        if node not in visited:
            visited.add(node)

            for child in node.children:
                _depth_first_search(child)

            topological_order.append(node)

    _depth_first_search(root)

    return list(reversed(topological_order))
```


```python
x_1 = Value(3)
x_2 = Value(4)
x_3 = x_1 * x_2
x_4 = Value(5)
x_5 = x_4 + x_3
x_6 = Value(2)
l = x_5 * x_6

l.backwards()

print(f"date={x_1.date} grad={x_1.grad}") # date=3 grad=8
print(f"date={x_2.date} grad={x_2.grad}") # date=4 grad=6
print(f"date={x_3.date} grad={x_3.grad}") # date=12 grad=2
print(f"date={x_4.date} grad={x_4.grad}") # date=5 grad=2
print(f"date={x_5.date} grad={x_5.grad}") # date=17 grad=2
print(f"date={x_6.date} grad={x_6.grad}") # date=2 grad=17
print(f"date={l.date} grad={l.grad}")     # date=34 grad=1
```

