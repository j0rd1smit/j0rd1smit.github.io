---
title: "Adding Application Insight Based Monitoring to Fastapi"
date: 2022-11-01T14:52:51+01:00
publishdate: 2022-11-01T14:52:51+01:00
tags: []
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---

TODO: post
- Motivate why you need monitoring
  - It help detecting problems in production
  - It shows trends over time. (Is my application becoming slower, is a certain end point becoming more popular)
- Monitoring and logging is hard i you have many different instance and deployment
- Application insight is Auzre solution to make logging and monitoring easier.
- First introduce how to send logs ti application insights then I show you how to intergarte it into a fastapi application

## How to send log to application insights
- Explain that there are two ways
- Explain the differance
- Explain that in theory you can do everything using a simple logger but a tracer can be more convient
- Explain the `instrumentation_key` and `opencensus`

### Logging events
- explain the `AzureLogHandler`.
- explain the `extra`

```python
import logging
import os

from opencensus.ext.azure.log_exporter import AzureLogHandler

logging.basicConfig(format="%(message)s")
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

instrumentation_key = os.environ["INSTRUMENTATION_KEY"]
logger.addHandler(
    AzureLogHandler(connection_string=f"InstrumentationKey={instrumentation_key}")
)

properties = {
    "custom_dimensions": {"key_1": "some value", "key_n": "something else"}
}
logger.info("hello world", extra=properties)
```
bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla.

{{< figure src="images/log_event_result.jpeg" caption="The resulting log in Application Insights." >}}

### Tracing durations
```python
import os
import random
import time

from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.trace.samplers import ProbabilitySampler
from opencensus.trace.span import SpanKind
from opencensus.trace.tracer import Tracer

# setup
sample_probability = 1.0
instrumentation_key = os.environ["INSTRUMENTATION_KEY"]
connection_string = f"InstrumentationKey={instrumentation_key}"
exporter = AzureExporter(connection_string=connection_string)
tracer = Tracer(sampler=ProbabilitySampler(sample_probability), exporter=exporter)

# start the measurement
span = tracer.start_span("your_log_name")
span.span_kind = SpanKind.SERVER
span.add_attribute("some_extra_data", "some_value")

# do something...
time.sleep(random.uniform(0, 1))

# add additional data
span.add_attribute("some_extra_data", "after_run_data")

# end the measurement
tracer.end_span()
tracer.finish()
```

{{< figure src="images/log_duration.jpg" caption="The resulting log in Application Insights." >}}
## Putting it all together
```python
import logging
import os
import random
import time
import traceback
from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.trace.samplers import AlwaysOnSampler
from opencensus.trace.span import SpanKind
from opencensus.trace.tracer import Tracer
from starlette.responses import StreamingResponse


class TracingMiddleware:
    def __init__(self) -> None:
        self.sampler = AlwaysOnSampler()
        instrumentation_key = os.environ["INSTRUMENTATION_KEY"]
        connection_string = f"InstrumentationKey={instrumentation_key}"
        self.exporter = AzureExporter(connection_string=connection_string)

    async def __call__(
            self,
            request: Request,
            call_next: Callable[[Request], Awaitable[StreamingResponse]],
    ) -> Response:
        tracer = Tracer(exporter=self.exporter, sampler=self.sampler)
        # create span
        span = tracer.start_span(f"[{request.method}]{request.method}")
        # This tells Azure's application insight that this log is a request.
        span.span_kind = SpanKind.SERVER
        # Add Default url information.
        span.add_attribute("http.host", request.url.hostname)
        span.add_attribute("http.method", request.method)
        span.add_attribute("http.path", request.url.path)
        span.add_attribute("http.url", str(request.url))
        span.add_attribute("http.rout", request.url.path)
        # Add application specific information.
        span.add_attribute("deployment_name", os.environ.get("deployment_name", ""))

        try:
            response = await call_next(request)
            span.add_attribute("http.status_code", response.status_code)
            tracer.end_span()
            tracer.finish()
            return response
        except Exception as e:
            # Add exception info to the log.
            span.add_attribute("error.name", e.__class__.__name__)
            span.add_attribute("error.message", str(e))
            span.add_attribute("stacktrace", "\n".join(traceback.format_tb(e.__traceback__)))
            span.add_attribute("http.status_code", 500)
            tracer.end_span()
            tracer.finish()
            raise e
            

# Setup the event logger
logging.basicConfig(format="%(message)s")
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
instrumentation_key = os.environ["INSTRUMENTATION_KEY"]
connection_string = f"InstrumentationKey={instrumentation_key}"
logger.addHandler(AzureLogHandler(connection_string=connection_string))

try:
    app = FastAPI()
    # Add the tracing middleware
    app.middleware("http")(TracingMiddleware())

    @app.get("/")
    def index():
        time.sleep(random.uniform(0, 1))
        return {"hello": "world"}

    logger.info(f"Server is ready")

except Exception as e:
    logger.exception(f"Exception={e}")
    raise e
```



## Create a dashboard

{{< figure src="images/avg_duration.jpg" caption="The resulting log in Application Insights." >}}

{{< figure src="images/number_of_request.jpg" caption="The resulting log in Application Insights." >}}