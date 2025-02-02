<template>
  <div class="space-y-8 text-gray-800">
    <BlogEntry
      title="Big update, #10, New page in project history"
      datetime="2024-05-08"
      date="Aug 09, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'Feature',
          content: [
            'Implement auth by Google and Github',
            'New design done my tailwindcss',
            'Nested history page',
            'All request for nesting saved in queue with persistance storage in MongoDB',
            'More DXF tags support',
          ],
        },
        {
          title: 'Tech task',
          content: [
            'New deploy by github actions',
            'Remove S3 bucket for infrastructure, all content saved into MongoDB',
          ],
        },
        {
          title: 'Next stages',
          content: ['DXF parsing polygones'],
        },
        {
          title: 'Thanks',
          content: 'Thanks to Dexus for the great project of parsing DXF',
        },
      ]"
    />
    <BlogEntry
      title="Big update, #9, My summer vacation (2)"
      datetime="2024-05-08"
      date="Aug 09, 2024"
      author="nest2d"
      :sections="[
        { title: 'New feature', content: ['Add support for Arc DXF tag'] },
        {
          title: 'Tech task',
          content: [
            'Migrate to jagua-rs',
            'Remove PostgreSQL',
            'Remove the old nest algorithm',
            'Add MongoDB for nested history',
            'Implement saving DXF and SVG files to MinIO',
          ],
        },
        {
          title: 'Next stages',
          content: ['Nested history page', 'More DXF tags support'],
        },
        {
          title: 'Thanks',
          content:
            'Thanks to JeroenGar for the great project, I hope it will be useful for me and for the community.',
        },
      ]"
    />
    <BlogEntry
      title="Big update, #8, My summer vacation"
      datetime="2024-05-08"
      date="Aug 05, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'New feature',
          content: ['Not new features, but a lot of changes under the hood.'],
        },
        {
          title: 'Tech task',
          content: [
            'Migrate to jagua-rs',
            'Remove PostgreSQL',
            'Remove the old nest algorithm',
            'Add MongoDB for nested history',
            'Implement saving DXF and SVG files to MinIO',
          ],
        },
        {
          title: 'Next stages',
          content: ['Nested history page', 'More DXF tags support'],
        },
        {
          title: 'Thanks',
          content:
            'Thanks to anyone who uses the project and uploads projects to the platform. It helps with development.',
        },
      ]"
    />

    <BlogEntry
      title="Project updates, #7, More DXF tag"
      datetime="2024-03-30"
      date="Mar 30, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'New feature',
          content: [
            'Add support for more DXF tags:',
            '- Add support for circle tag',
            '- Add support for circle Polyline',
          ],
        },
        {
          title: 'Fun news',
          content: 'The project has the first organic upload, thank you!!!',
        },
        {
          title: 'Tech task',
          content: ['Implement CI for the backend project'],
        },
        {
          title: 'Next stages',
          content: [
            'Implement the nested history page',
            'Add support for more DXF tags',
          ],
        },
      ]"
    />

    <BlogEntry
      title="Project updates, #6, Uploads from the web"
      datetime="2024-17-03"
      date="Mar 17, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'New feature',
          content: ['Implement creating project from webpage, user friendly'],
        },
        {
          title: 'Tech task',
          content: ['Try to make CI for the backend app. (in progress)'],
        },
        {
          title: 'Next stages',
          content: [
            'Implement the nested history page',
            'Finish CI for backend app',
            'Add support for more DXF tags',
          ],
        },
      ]"
    />
    <BlogEntry
      title="Project updates, #5, I learn how to do the database, also CI"
      datetime="2024-08-03"
      date="Mar 8, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'New feature',
          content: ['Move max nesting time to config'],
        },
        {
          title: 'Bug fix',
          content: ['Fix the database query', 'Speed up the new NFP cache'],
        },
        {
          title: 'Tech task',
          content: ['Make the CI which builds the docker image of the web app'],
        },
        {
          title: 'Next stages',
          content: [
            'Add CI for backend app',
            'Add support for more DXF tags',
            'Make it possible to add new projects for end users',
          ],
        },
      ]"
    />

    <BlogEntry
      title="Project updates, #4, We have the database"
      datetime="2024-27-02"
      date="Feb 27, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'New features',
          content: [
            'Implement database',
            'Move NFP pairs cache to PostgreSQL database',
            'Move all JSON file-based storage to PostgreSQL, like good developers in real apps',
            'Move all paths to files into the database',
            'Add a progress bar to the webpage. I hope it improves the user experience',
          ],
        },
        {
          title: 'Next stages',
          content: [
            'Implement CI for deploying docker containers for web and backend',
            'Better look for holes in preview images',
            'Speed up the new NFP cache',
            'Add support for more DXF tags',
          ],
        },
      ]"
    />

    <BlogEntry
      title="Project updates, #3, We have the cache"
      datetime="2024-18-02"
      date="Feb 18, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'New features',
          content: [
            'Implement cache for NFP pairs, each nesting adds new data to cache and improves future nest quality',
            'Added the preview photo to the project card',
          ],
        },
        {
          title: 'Next stages',
          content: [
            'Implement CI for deploying docker containers for web and backend',
            'Implement progress bar with timing or presented',
            'Better look for holes in preview images',
          ],
        },
      ]"
    />

    <BlogEntry
      title="Project updates, #2"
      datetime="2024-11-02"
      date="Feb 11, 2024"
      author="nest2d"
      :sections="[
        {
          title: 'New features',
          content: [
            'Fully support for LwPolyline (includes code 42 for bulge)',
            'Implement combine paths (currently not fully tested with combine path from different DXF types)',
          ],
        },
        {
          title: 'New projects',
          content: [
            'Laser gridfinity boxes by OpenSCAD (the project with Line)',
            'Big box, my big box for Laser gridfinity (the project proof the curse and inner hole works fine)',
          ],
        },
        {
          title: 'Next stages',
          content: [
            'Implement CI for deploying docker containers for web and backend',
            'Add the photo to the project',
            'Better look for holes in preview images',
          ],
        },
      ]"
    />

    <BlogEntry
      title="Project updates, #1"
      datetime="2024-08-02"
      date="Feb 8, 2024"
      author="nest2d"
      :sections="[
        {
          title: '',
          content:
            'The project migrated to Vue.js for implementation navigation inside SPA',
        },
        {
          title: 'Add features',
          content: [
            'Project list at main page',
            'New UI (based on Vue.js template)',
          ],
        },
        {
          title:
            'Currently the project supports the following DXF entity types',
          content: ['LwPolyline', 'Line'],
        },
        {
          title: 'Next stages',
          content: [
            'Add project with Line (getting the laser cutting gridfinity from OpenSCAD)',
            'Implement CI for deploying docker container',
            'Implement base support for shapes with holes',
            'Add the photo to the project',
          ],
        },
      ]"
    />

    <BlogEntry
      title="The start of project"
      datetime="2024-08-01"
      date="Feb 8, 2024"
      author="nest2d"
      :sections="[
        {
          title:
            'The online platform for Nest algorithm. What is Nest Problem?',
          content:
            'Given a square piece of material and some letters to be laser-cut: We want to pack all the letters into the square, using as little material as possible. If a single square is not enough, we also want to minimize the number of squares used. In the CNC world this is called `nesting`, and software that does this is typically targeted at industrial customers and very expensive.',
        },
        {
          title: 'Project goal',
          content: [
            'The project has a goal to create a fully open-source software for nesting irregular shapes into square.',
            'The second goal is creating a platform for makers to share laser cutting projects with the community and provide the best user experience, which will be achieved by features like an online nesting tool.',
          ],
        },
      ]"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: "doc",
});
</script>
