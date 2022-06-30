.PHONY: blog till

TIMESTAMP = $(shell date +'%Y-%m-%d')


blog:
	@read -p "Enter Module Name:" name; \
	name="blog/$(TIMESTAMP)-$$name"; \
	hugo new --kind post $$name

til:
	@read -p "Enter Module Name:" name; \
	name="til/$(TIMESTAMP)-$$name"; \
	hugo new --kind post $$name