import datetime
import webbrowser

from invoke import task, Context


@task
def build(ctx: Context) -> None:
    ctx.run("hugo --minify")


@task
def dev(ctx: Context) -> None:
    webbrowser.open('http://localhost:1313/')
    ctx.run("hugo server -D")


@task
def add_blog(ctx: Context, title: str, prefix: str | None = None) -> None:
    prefix = prefix or _get_timestamp()
    title = title.replace(" ", "-").lower()
    path = f"blog/{prefix}-{title}"

    ctx.run(f"hugo new --kind post {path}")

@task
def add_til(ctx: Context, title: str, prefix: str | None = None) -> None:
    prefix = prefix or _get_timestamp()
    title = title.replace(" ", "-").lower()
    path = f"til/{prefix}-{title}"

    ctx.run(f"hugo new --kind post {path}")

def _get_timestamp() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d")