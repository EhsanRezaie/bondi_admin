FROM nginx:alpine

COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template

# Static files are mounted from ./dist (CI deploys new code without rebuilding
# the image). Only the template + entrypoint live in the image. envsubst is
# scoped to $BACKEND_ORIGIN so nginx's own $vars ($host, $uri, …) stay intact.
CMD ["sh", "-c", "envsubst '${BACKEND_ORIGIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]