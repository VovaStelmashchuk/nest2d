## The nest2d file preprocessing worker 

The application use dxf handle value as unique identificator for mathing the parts, lines, polygones etc. Time to time some dxf doen't provide the handle as unique field.
The worker rebuild the dxf file, and create a valid JSON presentation for the dxf file, with list of close polygones and coresponding handle new the new file.

## Build docker image

```sh
docker build -t nest2d-worker-fileprocessing:local .
````

Run as service


```sh
docker service create \
  --name my-file-processing-service \
  --env-file ./.env \
  nest2d-worker-fileprocessing:local
```
