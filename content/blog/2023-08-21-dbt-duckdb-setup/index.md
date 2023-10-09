---
title: "Practicing your DBT skills locally with DuckDB"
date: 2023-08-21T16:26:34+02:00
publishdate: 2023-08-21T16:26:34+02:00
description: "Want to practice your DBT skills but don't have access to a data warehouse? In this post, I will show you how to run DBT without the for a cloud based data warehouse."
tags:
- dbt
- duckdb
- python
draft: false
math: false
image: "/cover.png"
use_featured_image: true
featured_image_size: 600x
---

After you follow one of the main excellent [DBT courses](https://courses.getdbt.com), it's time to start practicing.
However, there is one problem: you now need access to a data warehouse to run your DBT models, but you don't have access to one.
You can always rent something in the cloud but that is also not ideal.
Not only do you have to worry about staying with the free tier, but you also need to take care of many other things like creating the data warehouse, setting up the connection, etc.
Luckily, there is another option: [DuckDB](https://duckdb.org/).
With DuckDB, you run everything locally on your laptop, and everything is installable via a simple `pip install`, allowing you to focus on your learning journey.
Now, what does it take to create a DuckDB-based DBT project?

Before we begin, we need a Python virtual environment.
So first, create and activate a Python virtual environment using your favorite virtual environment manager (`env`, `conda`, `poetry`, etc.).
Next, we need to install the [DuckDB DBT adapter](https://github.com/duckdb/dbt-duckdb).
This is done by running the following command:

```bash
pip install dbt-duckdb
```

If everything went well, you should now be able to run `dbt --version`.
Now, we need to set up the dbt project structure.
This is done by running the following command:

```bash
dbt init
```

This will interactively ask you for a project name. Pick whatever you like, but remember it.
We will need it later.
It will also ask you which database you would like to use.
Pick `duckdb`.
After it is done, you should have a project structure that looks like this:

```text
├── .gitignore
├── README.md
├── analyses (folder)
│   └── .gitkeep
├── dbt_project.yml
├── macros (folder)
│   └── .gitkeep
├── models (folder)
│   └── example (folder)
│       ├── my_first_dbt_model.sql
│       ├── my_second_dbt_model.sql
│       └── schema.yml
├── seeds (folder)
│   └── .gitkeep
├── snapshots (folder)
│   └── .gitkeep
└── tests (folder)
    └── .gitkeep
```

Next, we need to create a `profiles.yml` file at the root of your project.
This file will tell DBT that it should use DuckDB and where to store the database.
After you created the file, add the following content to it:

```yaml
NAME_OF_YOUR_PROJECT:
  target: default
  outputs:
    default:
      type: duckdb
      path: db.duckdb # Feel free to change this path to store the database somewhere else
```

By default, `dbt init` will set the default profile name in your `dbt_project.yml` file to the project name you gave it.
That is why we used `NAME_OF_YOUR_PROJECT` in the `profiles.yml` file, if you want to change it, you need to change it in both files.
You can now test if everything is working by running:

```bash
dbt run
```

If everything went well, the default models should have been built successfully, and you should see a `db.duckdb` file in your project root.
This is where your DuckDB database stores its data.
That's it. You are now ready to practice your DBT skills without worrying about a data warehouse.
Good luck and keep practicing!
