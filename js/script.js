// ========================================
// TEMPLATE SITE - Main JavaScript
// Compatible with Forge CMS blog publishing
// ========================================

// ----------------------------------------
// Configuration
// ----------------------------------------
const CONFIG = {
    postsPath: '/blog/posts/posts.json',
    postsDir: '/blog/posts/',
    postsPerPage: 10
};

// Detect if we're running locally (file://) and adjust paths
const isLocalFile = window.location.protocol === 'file:';
const basePath = isLocalFile ? '.' : '';

// ----------------------------------------
// Initialization
// ----------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Initialize mobile navigation
    initNavToggle();

    // Initialize hero carousel if present
    initHeroCarousel();
});

// ----------------------------------------
// Hero Image Carousel
// ----------------------------------------
function initHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    let currentSlide = 0;
    const slideInterval = 5000; // Change image every 5 seconds

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    // Start the carousel
    setInterval(nextSlide, slideInterval);
}

// ----------------------------------------
// Mobile Navigation Toggle
// ----------------------------------------
function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');

    if (toggle && nav) {
        toggle.addEventListener('click', function() {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !expanded);
            nav.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!toggle.contains(e.target) && !nav.contains(e.target)) {
                toggle.setAttribute('aria-expanded', 'false');
                nav.classList.remove('active');
            }
        });
    }
}

// ----------------------------------------
// Blog: Load Recent Posts (Homepage)
// ----------------------------------------
async function loadRecentPosts(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const posts = await fetchPosts();

        if (posts.length === 0) {
            container.innerHTML = '<p>No news posts yet. Check back soon!</p>';
            return;
        }

        // Get most recent posts
        const recent = posts.slice(0, count);

        container.innerHTML = recent.map(post => `
            <article class="post-card">
                <p class="post-meta">
                    <time datetime="${post.date}">${formatDate(post.date)}</time>
                    <span class="post-category">${escapeHtml(post.category)}</span>
                </p>
                <h3><a href="blog/post.html?id=${post.id}">${escapeHtml(post.title)}</a></h3>
                <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            </article>
        `).join('');

    } catch (error) {
        console.error('Error loading recent posts:', error);
        container.innerHTML = '<p>Unable to load recent news.</p>';
    }
}

// ----------------------------------------
// Blog: Load Blog Listing Page
// ----------------------------------------
let allPosts = [];
let currentFilter = { type: 'all', value: null };

async function loadBlogListing() {
    try {
        allPosts = await fetchPosts();

        // Check URL for initial filter
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const tag = urlParams.get('tag');

        if (category) {
            currentFilter = { type: 'category', value: category };
        } else if (tag) {
            currentFilter = { type: 'tag', value: tag };
        }

        // Render components
        renderTagFilter();
        renderCategoriesSidebar();
        renderRecentPostsSidebar();
        renderAllTags();
        renderPostsList();

    } catch (error) {
        console.error('Error loading blog:', error);
        const container = document.getElementById('posts-list');
        if (container) {
            container.innerHTML = '<p class="error">Unable to load posts. Please try again later.</p>';
        }
    }
}

function renderPostsList() {
    const container = document.getElementById('posts-list');
    if (!container) return;

    // Filter posts based on current filter
    let posts = [...allPosts];

    if (currentFilter.type === 'category' && currentFilter.value) {
        posts = posts.filter(p => p.category === currentFilter.value);
    } else if (currentFilter.type === 'tag' && currentFilter.value) {
        posts = posts.filter(p => p.tags.includes(currentFilter.value));
    }

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="no-posts">
                <p>No posts found${currentFilter.value ? ` for "${currentFilter.value}"` : ''}.</p>
                <button onclick="clearFilter()" class="btn btn-outline">Show All Posts</button>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="post-card">
            <p class="post-meta">
                <time datetime="${post.date}">${formatDate(post.date)}</time>
                <span class="post-category">${escapeHtml(post.category)}</span>
            </p>
            <h3><a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a></h3>
            <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
            <div class="post-tags">
                ${post.tags.map(tag => `
                    <span class="tag" onclick="filterByTag('${escapeHtml(tag)}')" style="cursor:pointer">${escapeHtml(tag)}</span>
                `).join('')}
            </div>
        </article>
    `).join('');
}

function renderTagFilter() {
    const container = document.getElementById('tag-filter');
    if (!container || allPosts.length === 0) return;

    // Get unique tags
    const allTags = [...new Set(allPosts.flatMap(p => p.tags))].sort();

    container.innerHTML = `
        <button class="${currentFilter.type === 'all' ? 'active' : ''}" onclick="clearFilter()">All</button>
        ${allTags.map(tag => `
            <button
                class="${currentFilter.type === 'tag' && currentFilter.value === tag ? 'active' : ''}"
                onclick="filterByTag('${escapeHtml(tag)}')"
            >${escapeHtml(tag)}</button>
        `).join('')}
    `;
}

function renderCategoriesSidebar() {
    const container = document.getElementById('categories-list');
    if (!container || allPosts.length === 0) return;

    // Get unique categories with counts
    const categories = {};
    allPosts.forEach(post => {
        categories[post.category] = (categories[post.category] || 0) + 1;
    });

    container.innerHTML = Object.entries(categories)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([cat, count]) => `
            <li>
                <a href="?category=${encodeURIComponent(cat)}" onclick="event.preventDefault(); filterByCategory('${escapeHtml(cat)}')">
                    ${escapeHtml(cat)} (${count})
                </a>
            </li>
        `).join('');
}

function renderRecentPostsSidebar() {
    const container = document.getElementById('recent-posts-sidebar');
    if (!container || allPosts.length === 0) return;

    const recent = allPosts.slice(0, 5);

    container.innerHTML = recent.map(post => `
        <li>
            <a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a>
        </li>
    `).join('');
}

function renderAllTags() {
    const container = document.getElementById('all-tags');
    if (!container || allPosts.length === 0) return;

    const allTags = [...new Set(allPosts.flatMap(p => p.tags))].sort();

    container.innerHTML = allTags.map(tag => `
        <span class="tag" onclick="filterByTag('${escapeHtml(tag)}')" style="cursor:pointer">${escapeHtml(tag)}</span>
    `).join('');
}

function filterByTag(tag) {
    currentFilter = { type: 'tag', value: tag };
    updateURL();
    renderTagFilter();
    renderPostsList();
}

function filterByCategory(category) {
    currentFilter = { type: 'category', value: category };
    updateURL();
    renderTagFilter();
    renderPostsList();
}

function clearFilter() {
    currentFilter = { type: 'all', value: null };
    updateURL();
    renderTagFilter();
    renderPostsList();
}

function updateURL() {
    const url = new URL(window.location);
    url.searchParams.delete('category');
    url.searchParams.delete('tag');

    if (currentFilter.type === 'category' && currentFilter.value) {
        url.searchParams.set('category', currentFilter.value);
    } else if (currentFilter.type === 'tag' && currentFilter.value) {
        url.searchParams.set('tag', currentFilter.value);
    }

    window.history.pushState({}, '', url);
}

// ----------------------------------------
// Blog: Load Single Post
// ----------------------------------------
async function loadSinglePost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        showPostError('No post specified.');
        return;
    }

    try {
        const posts = await fetchPosts();
        const post = posts.find(p => p.id === postId);

        if (!post) {
            showPostError('Post not found.');
            return;
        }

        // Update page elements
        document.getElementById('page-title').textContent = `${post.title} - Organization Name`;
        document.getElementById('post-title').textContent = post.title;
        document.getElementById('post-meta').innerHTML = `
            <time datetime="${post.date}">${formatDate(post.date)}</time>
            ${post.author ? ` • ${escapeHtml(post.author)}` : ''}
            • ${escapeHtml(post.category)}
        `;

        // Render tags
        const tagsContainer = document.getElementById('post-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = post.tags.map(tag => `
                <a href="index.html?tag=${encodeURIComponent(tag)}" class="tag">${escapeHtml(tag)}</a>
            `).join('');
        }

        // Load and render markdown content
        const mdResponse = await fetch(`${getPostsDir()}${post.filename}`);
        if (!mdResponse.ok) throw new Error('Failed to load post content');

        const mdText = await mdResponse.text();
        const { content } = parseFrontMatter(mdText);

        const contentContainer = document.getElementById('post-content');
        if (contentContainer && typeof marked !== 'undefined') {
            marked.setOptions({
                headerIds: false,
                mangle: false
            });
            contentContainer.innerHTML = marked.parse(content);

            // Open external links in new tab
            contentContainer.querySelectorAll('a[href^="http"]').forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });
        } else if (contentContainer) {
            // Fallback if marked.js not loaded
            contentContainer.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
        }

        // Load sidebar content
        renderRecentPostsSidebar();
        renderCategoriesSidebar();
        allPosts = posts; // Make available for sidebar rendering

    } catch (error) {
        console.error('Error loading post:', error);
        showPostError('Unable to load post. Please try again later.');
    }
}

function showPostError(message) {
    const titleEl = document.getElementById('post-title');
    const contentEl = document.getElementById('post-content');

    if (titleEl) titleEl.textContent = 'Error';
    if (contentEl) {
        contentEl.innerHTML = `
            <p class="error">${escapeHtml(message)}</p>
            <a href="index.html" class="btn">&larr; Back to News</a>
        `;
    }
}

// ----------------------------------------
// Utility Functions
// ----------------------------------------

async function fetchPosts() {
    const response = await fetch(getPostsPath());
    if (!response.ok) throw new Error('Failed to fetch posts');

    const posts = await response.json();

    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return posts;
}

function getPostsPath() {
    // Handle both local file and server contexts
    if (isLocalFile) {
        // Determine relative path based on current page location
        const path = window.location.pathname;
        if (path.includes('/blog/')) {
            return 'posts/posts.json';
        }
        if (path.includes('/programs/')) {
            return '../blog/posts/posts.json';
        }
        return 'blog/posts/posts.json';
    }
    return CONFIG.postsPath;
}

function getPostsDir() {
    if (isLocalFile) {
        return 'posts/';
    }
    return CONFIG.postsDir;
}

function parseFrontMatter(text) {
    const regex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = text.match(regex);

    if (!match) {
        return { frontMatter: {}, content: text };
    }

    return { frontMatter: {}, content: match[2] };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ----------------------------------------
// Blog: Load Program Posts (Program Pages)
// ----------------------------------------
async function loadProgramPosts(containerId, tag, count = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const posts = await fetchPosts();

        // Filter by program tag
        const filteredPosts = posts.filter(p => p.tags.includes(tag));

        if (filteredPosts.length === 0) {
            container.innerHTML = '<p class="no-posts">No news for this program yet.</p>';
            return;
        }

        // Get most recent posts for this program
        const recent = filteredPosts.slice(0, count);

        container.innerHTML = recent.map(post => `
            <article class="program-post-item">
                <p class="post-meta">
                    <time datetime="${post.date}">${formatDate(post.date)}</time>
                </p>
                <h4><a href="../blog/post.html?id=${post.id}">${escapeHtml(post.title)}</a></h4>
            </article>
        `).join('');

    } catch (error) {
        console.error('Error loading program posts:', error);
        container.innerHTML = '<p class="no-posts">Unable to load news.</p>';
    }
}

// ----------------------------------------
// Utility: Get posts path for program pages
// ----------------------------------------
function getProgramPostsPath() {
    if (isLocalFile) {
        return '../blog/posts/posts.json';
    }
    return CONFIG.postsPath;
}

// Make functions available globally
window.loadRecentPosts = loadRecentPosts;
window.loadBlogListing = loadBlogListing;
window.loadSinglePost = loadSinglePost;
window.loadProgramPosts = loadProgramPosts;
window.filterByTag = filterByTag;
window.filterByCategory = filterByCategory;
window.clearFilter = clearFilter;
