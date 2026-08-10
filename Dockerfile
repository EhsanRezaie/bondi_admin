FROM nginx:alpine

COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template

# Static files are mounted from ./dist (CI deploys new code without rebuilding
# the image). Only the template + entrypoint live in the image.
CMD ["sh", "-c", "envsubst < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]