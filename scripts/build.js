/**
 * Thoughts: What I Need
 * - Front Matters (gray-matter)
 * - Templates (mustache)
 * - Layouts
 * - Markdown (marked)
 * - #TODO Partials
 */

const path = require('path');

const dateFns = require('date-fns');
const fs = require('fs-extra');
const marked = require('marked');
const matter = require('gray-matter');
const mustache = require('mustache');

(({ srcDir, postsDir, layoutsDir, distDir }) => {

const matterOptions = { excerpt: true, excerpt_separator: '<!-- more -->' };

const globals = {
  permalink: '<basepath>/<name>'
};

const defaults = {
  page: {
    layout: 'page',
  },
  post: {
    layout: 'post',
    permalink: 'posts/<year>/<month>/<name>',
  },
};

function loadFile(dir, filename, scoped) {
  const file = { src: filename };
  filepath = path.join(dir, filename);
  scoped = scoped || {};
  file.name = path.basename(filepath).match(/^(.+)\..+?$/)[1];
  const nameMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (nameMatch) {
    file.name = nameMatch[2];
    file.date = new Date(nameMatch[1]);
  }
  let content = fs.readFileSync(filepath, 'utf8');
  let data = { ...globals, ...scoped };
  file.isSource = matter.test(content);
  if (file.isSource) {
    let matterFile = matter(content, matterOptions);
    content = matterFile.content;
    data = { ...data, ...matterFile.data };
    if (path.extname(filename) === '.md') {
      content = marked(content);
    }
    file.layout = data.layout;
    file.title = data.title;
  }
  file.content = content;
  file.data = data;
  return file;
}

const pages = [];
function setupPage(filepath) {
  pages.push(loadFile(srcDir, filepath, defaults.page))
}
setupPage('index.md');
setupPage('posts.html');

const posts = fs.readdirSync(postsDir).map((filename) => loadFile(postsDir, filename, defaults.post));

const rawLayouts =
  fs.readdirSync(layoutsDir).map((filename) => loadFile(layoutsDir, filename))
  .reduce((object, file) => ({ ...object, [file.name]: file }), {});
const layouts = {};

function processLayout(name) {
  const file = rawLayouts[name];
  delete rawLayouts[name];
  const layout = {};
  let content = file.content;
  if (file.isSource) {
    if (file.layout) {
      if (rawLayouts.hasOwnProperty(file.layout)) {
        processLayout(file.layout);
      }
      content = applyLayout(file);
    }
  }
  layout.content = content;
  layouts[name] = layout;
}

while (Object.keys(rawLayouts).length > 0) {
  processLayout(Object.keys(rawLayouts)[0]);
}

// clean

if (fs.existsSync(distDir)) {
  fs.readdirSync(distDir).forEach((item) => fs.removeSync(path.join(distDir, item)));
} else {
  fs.mkdirSync(distDir);
}

// generate

function applyLayout(page) {
  let layout = '<!--$ &content $-->';
  if (page.layout) {
    if (layouts[page.layout] == null) {
      throw `Layout ${page.layout} not found`;
    }
    layout = layouts[page.layout].content;
  }
  return layout.replace('<!--$ &content $-->', page.content);
}

function render(page) {
  let content = applyLayout(page);
  const view = { globals, posts, pages, ...page };
  content = mustache.render(content, view, null, ['<!--$', '$-->']);
  return content;
}

function processPage(page) {
  let dest = page.data.permalink;
  dest = dest.replace('<basepath>', path.dirname(page.src));
  let name = path.basename(page.src).match(/^(.+)\..+?$/)[1];
  if (name === 'index') {
    name = '';
  }
  dest = dest.replace('<name>', name);
  const date = page.date || new Date();
  dest = dest.replace('<year>', dateFns.format(date, 'YYYY'));
  dest = dest.replace('<month>', dateFns.format(date, 'MM'));
  dest = dest.replace('<day>', dateFns.format(date, 'DD'));
  if (!dest.endsWith('.html')) {
    dest = path.join(dest, 'index.html');
  }
  let url = dest;
  if (path.basename(url) === 'index.html') {
    url = path.dirname(url);
  }
  url = path.join('/', url);
  page.url = url;
  dest = path.join(distDir, dest);
  fs.mkdirpSync(path.dirname(dest));
  fs.writeFileSync(dest, render(page));
}

for (const post of posts) {
  processPage(post);
}

for (const page of pages) {
  processPage(page);
}

})({
  srcDir: path.resolve(process.cwd(), 'src'),
  postsDir: path.resolve(process.cwd(), 'posts'),
  layoutsDir: path.resolve(process.cwd(), 'layouts'),
  distDir: path.resolve(process.cwd(), 'dist'),
});
