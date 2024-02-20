# Use a base image
FROM nginx:alpine

# Copy frontend files to the container
COPY . /usr/share/nginx/html

# Expose the port the app will run on
EXPOSE 80

# Command to run the application
CMD ["nginx", "-g", "daemon off;"]
