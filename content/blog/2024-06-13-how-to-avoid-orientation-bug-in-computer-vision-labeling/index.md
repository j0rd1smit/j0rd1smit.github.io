---
title: "How to avoid orientation bugs in Computer Vision labeling?"
description: "Image orientation metadata can cause strange bugs. This post teaches you how to identify these bugs and how to fix them."
date: 2024-04-13T19:54:44+02:00
publishdate: 2024-03-13T19:54:44+02:00
tags:
- computer vision
- labeling
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---

A while back, I encountered the strangest bug.
I was labeling an instance segmentation dataset, and to make the task easier, I had set up an active learning pipeline.
This pipeline used an initial version of the model to create pre-annotations, which it then automatically uploaded to Roboflow.
This way, I only had to adjust the mistakes in the pre-annotated prediction masks instead of creating them from scratch.
This pipeline allowed me to double my dataset size in a short time span.
Everything worked great until I decided to add some pictures I had taken with my phone to the dataset.
Initially, I inspected these images and their pre-annotations/predictions in a Jupyter notebook, and everything looked great.
However, once I started labeling the images and their pre-annotations in [RoboFlow](https://roboflow.com/), I noticed the image was rotated by 90 degrees compared to its annotations.
This bug rendered the pre-annotations useless.

{{< figure src="images/roboflow-incorrect-rotation-meta-data-useage.jpg" caption="This is how the image and the pre-annotations looked in RoboFlow." >}}

I was completely puzzled by this behavior.
The strangest part was that it happened for some images but not for others.
Even more interesting, this behavior was not unique to [RoboFlow](https://roboflow.com/).
It also happened in [Label Studio](https://labelstud.io/), and the strangest part was that the bug was consistent between the two platforms.
But when I inspected it in locally in MacOS Preview and Python, the pre-annotations were correct.
What was going on?

{{< figure src="images/label-studio-incorrect-rotation-meta-data-useage.jpg" caption="This is how the image and the pre-annotations looked in Label Studio." >}}

It turns out that when you take a picture with a smartphone, the phone's orientation is recorded in the image's metadata.
Many applications (e.g., MacOS Preview and Python's Pillow) use this information to display the image in the correct orientation.
However, not all software and websites do this.
Normally, this is not a big issue, but it is a big problem in an active learning pipeline.
In my case, my pipeline opened the image with Pillow, which rotated the image based on the metadata, and thus, the pre-annotations were created based on this rotated version.
When it uploaded the images to RoboFlow or Label Studio, you upload both the image and the annotations.
However, when RoboFlow and Label Studio display the image in their UI, they ignore the orientation metedata and thus the annotations do not align anymore.

## How do we fix this?

The problem is that the metadata is not used consistently between different software.
So, the best way to fix this is to read the metadata once, rotate the image to the correct orientation, and then save the image without the metadata.
This way, everyone will display the image consistently.
Luckily, we can fix this with Python using the function below.
It reads the metadata.
If there is any orientation metadata and the orientation is not the default, it rotates the image.
Then, the updated image is returned without the metadata.

```python
from PIL import Image

def _fix_rotation(image: Image) -> Image:  
    # Read the metadata of the image
    exif = image._getexif()  
    # The metadata key for the orientation of the image
    orientation_key = 274
    no_orientation_metadata_present = exif is None or orientation_key not in exif
    if no_orientation_metadata_present:
        # Do nothing
        return image
    
    orientation = exif[orientation_key]
    # The rotation values are represented using integer values 
    # that map to the following degrees
    rotation_values = {3: 180, 6: 270, 8: 90}  
    if orientation in rotation_values:  
        return image.rotate(rotation_values[orientation], expand=True)  
  
    return image
```

This orientation bug is very subtle but sadly very common.
Therefore, you should always remove the orientation metadata from any image before labeling it.
Better safe than sorry.
