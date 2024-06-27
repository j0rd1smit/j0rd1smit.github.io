---
title: "How to Upload Pre-Annotations to Roboflow"
description: ""
date: 2024-06-13T21:44:10+02:00
publishdate: 2024-06-13T21:44:10+02:00
tags: []
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---

Labeling instance segmentation masks is one of the most time-consuming and tedious tasks there is in computer vision.
Yet, it is vital you do it right if your accurate model.
Luckily, there is a way to speed up the process.
Once you have a model, you can use it to generate predictions on the unlabeled images.
We can then upload these predictions as pre-annotations.
Then in our labeling tool, we only need to adjust the pre-annotations that are wrong instead of drawing all the polygons from scratch.
This approach has two major benefits:

1. It is way faster and will become even faster as the model improves.
2. It shows the limitations and failures of the model, which can guide your data collection efforts.

One of my favorite tools for labeling is Roboflow.
Sadly, from the documentation, it is not clear how to upload pre-annotations.
This post will show you how to do it.

## Uploading using the Python SDK

Roboflow has a Python SDK, which we can use to upload (pre-)annotations.
Before we can do we first need to install the SDK.

```bash
pip install roboflow
```

Secondly, we need to know our Roboflow API key, workspace name, and project and project name.
You can find your API key in your Roboflow account settings.
The workspace and project name can be found in the URL of the project.
For example, if the URL is `https://app.roboflow.com/workspaces/<your-workspace>/projects/<your-project>`.

Once we have all this information, we can upload the (pre-)annotations using the following code.

```python
from roboflow import Roboflow
import os

rf = Roboflow(api_key=os.environ["ROBOFLOW_API_KEY"])
rf_workspace = rf.workspace(os.environ["ROBOFLOW_WORKSPACE"])
rf_project = rf_workspace.project(os.environ["ROBOFLOW_PROJECT"])

image_path = "path/to/your/image.jpg"
label_path = "path/to/your/label.txt"
label_map_path = "path/to/your/label_mapping.txt"

response = rf_project.single_upload(
    image_path=str(image_path),
    annotation_path=label_path,
    annotation_labelmap=str(label_map_path),
    annotation_overwrite=True,
    batch_name="my_batch", 
    is_prediction=True,
)
```

The label file should be in yolo text format for your project (e.g., bounding boxes, polygons, etc.).
The yolo text indicates a class with integer index.
So inform roboflow about the actual class names, we provide a label mapping file.
This is a text file where the ith line is the name of the ith class.
It is also very important to set `is_prediction=True`.
If you set it to `False`, Roboflow assumes it a ground truth import, and it will directly add it your dataset.
Optionally, you set the `batch_name` to group all the pre-annotations in a single labeling job.

## Find the results in the UI

After running the above code, a new annotation job will appear in your Roboflow project.
You can find

{{< figure src="images/new-job-is-waiting.jpg" caption="You can find the new annotation job by clicking on 'Annotate' in the left menu." >}}

After starting the job and opening the image, you will see the pre-annotations.
They look like any other annotation.
If any of them are wrong, you can click on them and adjust them.
Once you are happy, you can add the image to your dataset.

{{< figure src="images/pre-annotation-in-labeling-ui.jpg" caption="These pre-annotations can save you a lot of time especially if you have a lot of instances to label like in this image." >}}

## Optional down sampling of polygons

Pre-annotations are only useful if they are easy to adjust.
However, sometimes the predicted polygons have so many points in them that it becomes impossible to adjust them.
