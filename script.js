document.addEventListener('DOMContentLoaded', () => {
    // Fade-in animation for sections
    const sections = document.querySelectorAll('section');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    sections.forEach(section => {
        observer.observe(section);
    });

    const projectsContainer = document.getElementById('projects-container');
    const username = 'LazyDevUserX';
    const apiUrl = `https://api.github.com/users/${username}/repos`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(repos => {
            const nonForkedRepos = repos.filter(repo => !repo.fork);
            const promises = nonForkedRepos.map(repo => {
                return fetch(`https://api.github.com/repos/${username}/${repo.name}/contents`)
                    .then(res => res.json())
                    .then(contents => {
                        repo.contents = contents;
                        return repo;
                    });
            });
            return Promise.all(promises);
        })
        .then(repos => {
            const categorizedProjects = {
                extensions: [],
                userscripts: [],
                webpages: [],
                others: []
            };

            repos.forEach(repo => {
                const contents = repo.contents;
                if (Array.isArray(contents)) {
                    if (contents.some(file => file.name.endsWith('.user.js'))) {
                        categorizedProjects.userscripts.push(repo);
                    } else if (contents.some(file => file.name === 'manifest.json')) {
                        categorizedProjects.extensions.push(repo);
                    } else if (contents.some(file => file.name === 'index.html')) {
                        categorizedProjects.webpages.push(repo);
                    } else {
                        categorizedProjects.others.push(repo);
                    }
                }
            });

            displayProjects(categorizedProjects.extensions);
            displayProjects(categorizedProjects.userscripts);
            displayProjects(categorizedProjects.webpages);
            displayProjects(categorizedProjects.others);
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            projectsContainer.innerHTML = '<p>Could not load projects.</p>';
        });

    function displayProjects(projects) {
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';

            let userScriptFile = '';
            if (project.contents.some(file => file.name.endsWith('.user.js'))) {
                userScriptFile = project.contents.find(file => file.name.endsWith('.user.js')).name;
            }

            let projectLink = project.html_url;
            let linkIcon = 'fa-github';
            if (project.has_pages) {
                projectLink = `https://${username}.github.io/${project.name}/`;
                linkIcon = 'fa-external-link-alt';
            } else if (userScriptFile) {
                projectLink = `https://raw.githubusercontent.com/${username}/${project.name}/main/${userScriptFile}`;
            }

            projectCard.innerHTML = `
                <div class="project-header">
                    <i class="far fa-folder-open"></i>
                    <div class="project-links">
                        <a href="${project.html_url}" target="_blank" aria-label="GitHub Link"><i class="fab fa-github"></i></a>
                        ${project.has_pages || userScriptFile ? `<a href="${projectLink}" target="_blank" aria-label="External Link"><i class="fas ${linkIcon}"></i></a>` : ''}
                    </div>
                </div>
                <h3>${project.name}</h3>
                <p>${project.description || 'No description available.'}</p>
            `;
            projectsContainer.appendChild(projectCard);
        });
    }
});
