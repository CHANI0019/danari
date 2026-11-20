import { categories, projects } from './data/projects.js';

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.selectedProject = null;

    // DOM Elements
    this.categoryContainer = document.getElementById('category-filters');
    this.sidebar = document.getElementById('sidebar');
    this.projectList = document.getElementById('project-list');
    this.projectCountBadge = document.getElementById('project-count-badge');
    this.searchInput = document.getElementById('search-input');
    this.detailPanel = document.getElementById('detail-panel');
    this.tooltip = document.getElementById('planet-tooltip');

    this.init();
  }

  init() {
    this.renderCategoryFilters();
    this.renderProjectList();
    this.bindEvents();
    this.bindSceneCallbacks();
  }

  renderCategoryFilters() {
    this.categoryContainer.innerHTML = '';
    Object.entries(categories).forEach(([key, info]) => {
      const btn = document.createElement('button');
      btn.className = `filter-btn ${key === this.currentCategory ? 'active' : ''}`;
      btn.textContent = info.label;
      btn.dataset.category = key;
      btn.addEventListener('click', () => {
        this.setCategory(key);
      });
      this.categoryContainer.appendChild(btn);
    });
  }

  renderProjectList() {
    this.projectList.innerHTML = '';
    const filtered = projects.filter(p => {
      const matchCat = this.currentCategory === 'all' || p.category === this.currentCategory;
      const matchSearch = p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (p.summary && p.summary.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    this.projectCountBadge.textContent = filtered.length;

    filtered.forEach(p => {
      const item = document.createElement('div');
      item.className = `project-item ${this.selectedProject?.id === p.id ? 'active' : ''}`;
      item.innerHTML = `
        <span class="project-color-dot" style="background-color: ${p.color}; color: ${p.color};"></span>
        <div class="project-info">
          <div class="project-name">${p.title}</div>
          <div class="project-cat">${categories[p.category]?.label || p.category}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        this.selectProject(p);
        this.scene.focusPlanet(p.id);
      });
      this.projectList.appendChild(item);
    });
  }

  setCategory(catKey) {
    this.currentCategory = catKey;
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.category === catKey);
    });
    this.renderProjectList();
    this.scene.filterCategory(catKey);
  }

  bindEvents() {
    // Reset view button
    document.getElementById('btn-reset-view').addEventListener('click', () => {
      this.scene.resetView();
      this.closeDetail();
    });

    // Toggle sidebar
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const closeSidebarBtn = document.getElementById('btn-close-sidebar');
    toggleBtn.addEventListener('click', () => {
      this.sidebar.classList.toggle('closed');
    });
    closeSidebarBtn.addEventListener('click', () => {
      this.sidebar.classList.add('closed');
    });

    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      this.renderProjectList();
    });

    // Close detail panel
    document.getElementById('btn-close-detail').addEventListener('click', () => {
      this.closeDetail();
    });

    // Focus planet button in detail panel
    document.getElementById('btn-focus-planet').addEventListener('click', () => {
      if (this.selectedProject) {
        this.scene.focusPlanet(this.selectedProject.id);
      }
    });

    // Copy local path button
    document.getElementById('btn-copy-path').addEventListener('click', () => {
      const pathText = document.getElementById('detail-path').textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(pathText);
        const btn = document.getElementById('btn-copy-path');
        const orig = btn.textContent;
        btn.textContent = '복사됨!';
        setTimeout(() => btn.textContent = orig, 1800);
      }
    });
  }

  bindSceneCallbacks() {
    // When a planet is clicked in 3D scene
    this.scene.onSelectPlanet = (proj) => {
      this.selectProject(proj);
    };

    // When hovering over a planet
    this.scene.onHoverPlanet = (proj, x, y) => {
      if (proj && x !== undefined && y !== undefined) {
        this.tooltip.querySelector('.tooltip-title').textContent = proj.title;
        this.tooltip.querySelector('.tooltip-sub').textContent = categories[proj.category]?.label || proj.category;
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
        this.tooltip.classList.add('visible');
      } else {
        this.tooltip.classList.remove('visible');
      }
    };
  }

  selectProject(proj) {
    this.selectedProject = proj;
    this.renderProjectList(); // Update active state

    // Populate detail panel
    const catBadge = document.getElementById('detail-category');
    catBadge.textContent = categories[proj.category]?.label || proj.category;
    catBadge.style.borderColor = proj.color;
    catBadge.style.color = proj.color;

    document.getElementById('detail-title').textContent = proj.title;
    document.getElementById('detail-summary').textContent = proj.summary || '프로젝트 요약';
    document.getElementById('detail-summary').style.borderColor = proj.color;
    document.getElementById('detail-desc').textContent = proj.description || '';

    // Web URL
    const metaUrlRow = document.getElementById('meta-url-row');
    if (proj.url) {
      metaUrlRow.style.display = 'flex';
      const urlLink = document.getElementById('detail-url');
      urlLink.href = proj.url;
      document.getElementById('detail-url-text').textContent = proj.url;
    } else {
      metaUrlRow.style.display = 'none';
    }

    // Local Path
    const metaPathRow = document.getElementById('meta-path-row');
    if (proj.localPath) {
      metaPathRow.style.display = 'flex';
      document.getElementById('detail-path').textContent = proj.localPath;
    } else {
      metaPathRow.style.display = 'none';
    }

    // Satellites section
    const satSection = document.getElementById('detail-satellites-section');
    const satList = document.getElementById('detail-satellites-list');
    if (proj.satellites && proj.satellites.length > 0) {
      satSection.style.display = 'block';
      satList.innerHTML = proj.satellites.map(s => `
        <div class="satellite-card">
          <div class="sat-name">✦ ${s.name}</div>
          <div class="sat-desc">${s.desc}</div>
          ${s.path ? `<div class="sat-path">${s.path}</div>` : ''}
        </div>
      `).join('');
    } else {
      satSection.style.display = 'none';
    }

    // Tags
    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = proj.tags.map(t => `<span class="detail-tag">#${t}</span>`).join('');

    // Open detail panel
    this.detailPanel.classList.remove('closed');
  }

  closeDetail() {
    this.detailPanel.classList.add('closed');
    this.selectedProject = null;
    this.renderProjectList();
  }
}

