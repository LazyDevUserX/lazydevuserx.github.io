document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const username = 'LazyDevUserX';
    const apiUrl = `https://api.github.com/users/${username}/repos`;

    const categorizedProjects = {
        extensions: [],
        userscripts: [],
        webpages: []
    };

    fetch(apiUrl)
        .then(response => response.json())
        .then(repos => {
            const nonForkedRepos = repos.filter(repo => !repo.fork);

            const categorizationPromises = nonForkedRepos.map(repo => {
                return fetch(`https://api.github.com/repos/${username}/${repo.name}/contents`)
                    .then(response => response.json())
                    .then(contents => {
                        if (Array.isArray(contents)) {
                            const userScriptFile = contents.find(file => file.name.endsWith('.user.js'));
                            if (userScriptFile) {
                                repo.userScriptFile = userScriptFile.name;
                                categorizedProjects.userscripts.push(repo);
                            } else if (contents.some(file => file.name === 'manifest.json')) {
                                categorizedProjects.extensions.push(repo);
                            } else if (contents.some(file => file.name === 'index.html')) {
                                categorizedProjects.webpages.push(repo);
                            }
                        }
                    });
            });

            return Promise.all(categorizationPromises).then(() => {
                displayProjects();
            });
        })
        .catch(error => {
            console.error('Error fetching repositories:', error);
            projectsContainer.innerHTML = '<p>Could not fetch projects. Please try again later.</p>';
        });

    function displayProjects() {
        projectsContainer.innerHTML = ''; // Clear previous content

        const createSection = (title, projects, category) => {
            if (projects.length > 0) {
                const sectionContainer = document.createElement('div');
                sectionContainer.className = 'project-category';

                const sectionTitle = document.createElement('h2');
                sectionTitle.className = 'section-title';
                sectionTitle.textContent = title;
                projectsContainer.appendChild(sectionTitle);

                const categoryGrid = document.createElement('div');
                categoryGrid.className = 'project-grid';

                projects.forEach(project => {
                    const projectCard = document.createElement('div');
                    projectCard.className = 'project-card';

                    let installLink = `https://github.com/${username}/${project.name}`;
                    let linkText = 'View Project';

                    if (category === 'userscripts' && project.userScriptFile) {
                        installLink = `https://raw.githubusercontent.com/${username}/${project.name}/main/${project.userScriptFile}`;
                        linkText = 'Install Script';
                    } else if (category === 'webpages' && project.has_pages) {
                        installLink = `https://${username}.github.io/${project.name}/`;
                        linkText = 'View Live';
                    }

                    projectCard.innerHTML = `
                        <div class="project-card-content">
                            <h3>${project.name}</h3>
                            <p>${project.description || 'No description available.'}</p>
                        </div>
                        <div class="project-card-footer">
                            <a href="${installLink}" target="_blank">${linkText}</a>
                            <a href="https://github.com/${username}/${project.name}" target="_blank" class="github-link"><i class="fab fa-github"></i></a>
                        </div>
                    `;
                    categoryGrid.appendChild(projectCard);
                });
                projectsContainer.appendChild(categoryGrid);
            }
        };

        createSection('Extensions', categorizedProjects.extensions, 'extensions');
        createSection('Userscripts', categorizedProjects.userscripts, 'userscripts');
        createSection('Webpages', categorizedProjects.webpages, 'webpages');
    }
});
