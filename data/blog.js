export const posts = [
    {
        title: '!!! Big data migration',
        datetime: '2025-06-07',
        sections: [
            {
                title: 'Big data migration',
                content: [
                    'Currently the project run the big data migration. I want to change the project data base schema to improve the project performance and scalability.',
                    'In case you experience any issues with the project, please contact me via support chat, or email: vovochkastelmashchuk@gmail.com',
                ],
            },
        ]
    },
    {
        title: 'Project updates, #13, multisheet support',
        datetime: '2025-06-07',
        sections: [
            {
                title: 'New feature',
                content: [
                    'Implement support for multisheet DXF files',
                    'Add stripe support, help me to pay for the server',
                ],
            },
        ]
    },
    {
        title: 'Project updates, #12, bug fixes',
        datetime: '2025-05-28',
        sections: [
            {
                title: 'New feature',
                content: [
                    'Implement support chat',
                ],
            },
            {
                title: 'Bug fix',
                content: [
                    'Fix parsing for file with not utf-8 encoding',
                    'Fix output DXF units, now it is mm',
                ],
            }
        ]
    },
    {
        title: 'Big update, #11, New design',
        datetime: '2025-03-08',
        sections: [
            {
                title: 'Feature',
                content: [
                    'New design with better user experience',
                ],
            },
            {
                title: 'Next stages',
                content: [
                    'Fix DXF parsing'
                ],
            },
            {
                title: 'Thanks',
                content: [
                    'Thanks to Max Lozianko for new design',
                    'Thanks to Mykola Holovashchenko for new frontend',
                ],
            },
        ]
    },
    {
        title: 'Big update, #10, New page in project history',
        datetime: '2024-08-30',
        sections: [
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
                content: [
                    'DXF parsing polygones'
                ],
            },
            {
                title: 'Thanks',
                content: 'Thanks to Dexus for the great project of parsing DXF',
            },
        ]
    },
    {
        title: 'Big update, #9, My summer vacation (2)',
        datetime: '2024-05-08',
        sections: [
            {
                title: 'New feature',
                content: [
                    'Add support for Arc DXF tag'
                ]
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
                content: [
                    'Nested history page',
                    'More DXF tags support'
                ],
            },
            {
                title: 'Thanks',
                content: 'Thanks to JeroenGar for the great project, I hope it will be useful for me and for the community.'
            },
        ]
    },
    {
        title: 'Big update, #8, My summer vacation',
        datetime: '2024-05-08',
        sections: [
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
                content: [
                    'Nested history page',
                    'More DXF tags support'
                ],
            },
            {
                title: 'Thanks',
                content: 'Thanks to anyone who uses the project and uploads projects to the platform. It helps with development.'
            },
        ]
    },
    {
        title: 'Project updates, #7, More DXF tag',
        datetime: '2024-03-30',
        sections: [
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
                content: 'The project has the first organic upload, thank you!!!'
            },
            {
                title: 'Tech task',
                content: [
                    'Implement CI for the backend project'
                ],
            },
            {
                title: 'Next stages',
                content: [
                    'Implement the nested history page',
                    'Add support for more DXF tags',
                ],
            },
        ]
    },
    {
        title: 'Project updates, #6, Uploads from the web',
        datetime: '2024-03-17',
        sections: [
            {
                title: 'New feature',
                content: [
                    'Implement creating project from webpage, user friendly'
                ],
            },
            {
                title: 'Tech task',
                content: [
                    'Try to make CI for the backend app. (in progress)'
                ],
            },
            {
                title: 'Next stages',
                content: [
                    'Implement the nested history page',
                    'Finish CI for backend app',
                    'Add support for more DXF tags',
                ],
            },
        ]
    },
    {
        title: 'Project updates, #5, I learn how to do the datebase, also CI',
        datetime: '2024-03-08',
        sections: [
            {
                title: 'New feature',
                content: [
                    'Move max nesting time to config'
                ],
            },
            {
                title: 'Bug fix',
                content: [
                    'Fix the datebase query', 'Speed up the new NFP cache'
                ],
            },
            {
                title: 'Tech task',
                content: [
                    'Make the CI which builds the docker image of the web app'
                ],
            },
            {
                title: 'Next stages',
                content: [
                    'Add CI for backend app',
                    'Add support for more DXF tags',
                    'Make it possible to add new projects for end users',
                ],
            },
        ]
    },
    {
        title: 'Project updates, #4, We have the datebase',
        datetime: '2024-02-27',
        sections: [
            {
                title: 'New features',
                content: [
                    'Implement datebase',
                    'Move NFP pairs cache to PostgreSQL datebase',
                    'Move all JSON file-based storage to PostgreSQL, like good developers in real apps',
                    'Move all paths to files into the datebase',
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
        ]
    },
    {
        title: 'Project updates, #3, We have the cache',
        datetime: '2024-02-18',
        sections: [
            {
                title: 'New features',
                content: [
                    'Implement cache for NFP pairs, each nesting adds new date to cache and improves future nest quality',
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
        ]
    },
    {
        title: 'Project updates, #2',
        datetime: '2024-02-11',
        sections: [
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
        ]
    },
    {
        title: 'Project updates, #1',
        datetime: '2024-02-08',
        sections: [
            {
                content: 'The project migrated to Vue.js for implementation navigation inside SPA'
            },
            {
                title: 'Add features',
                content: [
                    'Project list at main page',
                    'New UI (based on Vue.js template)',
                ],
            },
            {
                title: 'Currently the project supports the following DXF entity types',
                content: [
                    'LwPolyline',
                    'Line'
                ],
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
        ]
    },
    {
        title: 'The start of project',
        datetime: '2024-01-08',
        sections: [
            {
                title: 'The online platform for Nest algorithm. What is Nest Problem?',
                content: 'Given a square piece of material and some letters to be laser-cut: We want to pack all the letters into the square, using as little material as possible. If a single square is not enough, we also want to minimize the number of squares used. In the CNC world this is called `nesting`, and software that does this is typically targeted at industrial customers and very expensive.'
            },
            {
                title: 'Project goal',
                content: [
                    'The project has a goal to create a fully open-source software for nesting irregular shapes into square.',
                    'The second goal is creating a platform for makers to share laser cutting projects with the community and provide the best user experience, which will be achieved by features like an online nesting tool.',
                ],
            },
        ]
    }
]
