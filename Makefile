.PHONY: blog till dev


TIMESTAMP = $(shell date +'%Y-%m-%d')

# Make a new blog post.
blog:
	echo "Enter name of blog:"; \
	read name; \
	name="blog/$(TIMESTAMP)-$$(echo $$name | tr ' ' '-')"; \
	hugo new --kind post $$name

# Make a new til post.
til:
	echo "Enter name of TIL:"; \
	read name; \
	name="til/$(TIMESTAMP)-$$(echo $$name | tr ' ' '-')"; \
	hugo new --kind post $$name

# Start a local dev server.
dev:
	hugo -D server