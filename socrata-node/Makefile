all: $(basename $(wildcard *.js.in))

clean: $(wildcard *.js.in)
	rm -f $(basename $^)

%.js: %.js.in
	cpp -P -C $^ $@
