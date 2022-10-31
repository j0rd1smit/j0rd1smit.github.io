---
title: "How to Find the Last Record in a Group Using KQL"
date: 2022-10-31T14:09:56+01:00
publishdate: 2022-10-31T14:09:56+01:00
tags: []
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 350x
---

Today, I was building a dashboard in Azure's Application Insight (TODO link) that needed to show the number of deployments behind each load balancer over time in an application.
All the deployments in this application are periodically queried for the current health status via a health REST API call.
Each application logs its unique deployment ID and load balancer ID during this health request to Azure's Application insights.
So to create this dashboard, I had to do the following:
1. Group all the health requests in a given interval by their deployment ID, load balancer ID, and interval and take the last record in this group.
2. Group all the remaining records by their load balancer ID and count the number of deployments.
3. Create a plot that shows the total number of deployments per load balancer over time.

Today I learned that you could implement step 1 using the `arg_max` in Azure's Application Insight querying language (KQL). 
The `arg_max(x, y)  by z` function finds the record with the largest value for `x` in group `z` and then returns the columns `y`. 
In our case, we can use `summarize arg_max(timestamp, *) by endpoint, deployment, bin(timestamp, 5m)` to find the record with the largest timestamp in our endpoint, deployment, and interval group. 
In this case, use `*` to indicate that the `arg_max` function should return all the columns of the selected record. 
So, with this new insight, we can build our dashboard using the following KQL query.

```kql
requests
// add our custom data to query.
| extend
    endpoint = tostring(customDimensions["load_balancer_id"]),
    deployment = tostring(customDimensions["deployment_id"])
// obtain the last health check record at 5m intervals
| summarize arg_max(timestamp, *) by endpoint, deployment, bin(timestamp, 5m)
// count the number of deployments at 5m intervals
| summarize number_of_deployments=count() by endpoint, bin(timestamp, 5m)
```