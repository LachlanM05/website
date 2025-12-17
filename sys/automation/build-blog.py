#!/usr/bin/env python3
import os 
import re 
import datetime 
import glob 

# This script will make all blog files from templates, and drawing blogs from Markdown files.

# config
POSTS_DIR= "assets/blog/posts"
TEMPLATE_DIR= "assets/blog/templates"
OUTPUT_DIR= "blog"

# ensure output directory exists (will exist after first run, since import is on an "overwrite" process, not a clear and write.)
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def parse_markdown(md_content):
    # simple parser to handle frontmatter and basic md
    # format:
    #
    # title: Hog 2.3 OPP
    # date: 2025-12-17
    # description: HOG SUPER OP, Read More...
    #
    # uses american for here, but build sorts us out :3


    frontmatter = {}
    content = md_content
    
    # extract formatter
    fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', md_content, re.DOTALL)
    if fm_match:
        fm_text = fm_match.group(1)
        content = fm_match.group(2)
        for line in fm_text.split('\n'):
            if ':' in line:
                key, val = line.split(':', 1)
                frontmatter[key.strip()] = val.strip()
    
    # basic markdown conversion function
    # TODO: investigate markdown python library and weigh up installing it
    # for now, a basic regex parser is used
    
    # code blocks
    content = re.sub(r'```(.*?)```', r'<pre><code>\1</code></pre>', content, flags=re.DOTALL)
    # inline code
    content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)
    # head (WOAAAH)
    content = re.sub(r'^### (.*)$', r'<h3>\1</h3>', content, flags=re.MULTILINE)
    content = re.sub(r'^## (.*)$', r'<h2>\1</h2>', content, flags=re.MULTILINE)
    content = re.sub(r'^# (.*)$', r'<h1>\1</h1>', content, flags=re.MULTILINE)
    # links [text](url)
    content = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', content)
    # paragraphs
    paragraphs = content.split('\n\n')
    html_content = ""
    for p in paragraphs:
        p = p.strip()
        if not p: continue
        if not p.startswith('<') and not p.startswith('```'):
            html_content += f"<p>{p}</p>\n"
        else:
            html_content += f"{p}\n"
            
    return frontmatter, html_content

def build():
    print("Building blog...")
    
    tpl_index = read_file(os.path.join(TEMPLATE_DIR, "index.html"))
    tpl_post = read_file(os.path.join(TEMPLATE_DIR, "post.html"))
    
    posts = []
    
    for filepath in glob.glob(os.path.join(POSTS_DIR, "*.md")):
        filename = os.path.basename(filepath)
        slug = filename.replace('.md', '.html')
        raw = read_file(filepath)
        meta, html_body = parse_markdown(raw)
        
        title = meta.get('title', 'Untitled')
        raw_date = meta.get('date', '1970-01-01') # Keep YYYY-MM-DD for sorting
        desc = meta.get('description', '')
        
        # change date formatting
        try:
            # parse ISO (YYYY-MM-DD) and convert to the clearly superior (DD-MM-YYYY)
            dt = datetime.datetime.strptime(raw_date, "%Y-%m-%d")
            display_date = dt.strftime("%d/%m/%Y")
        except ValueError:
            # fallbakc if date in markdown is invalid
            display_date = raw_date

        # render post using it
        post_html = tpl_post.replace('{{TITLE}}', title)
        post_html = post_html.replace('{{DATE}}', display_date)
        post_html = post_html.replace('{{CONTENT}}', html_body)
        
        write_file(os.path.join(OUTPUT_DIR, slug), post_html)
        print(f"  Generated: {slug}")
        
        posts.append({
            'title': title,
            'sort_date': raw_date,      # use raw YYYY-MM-DD for sorting logic (one day i'll scrub this completely.)
            'display_date': display_date, # use formatted date for UI
            'desc': desc,
            'url': f"/blog/{slug}"
        })
    
    # sort by the raw date so it's chronologically correct
    posts.sort(key=lambda x: x['sort_date'], reverse=True)
    
    # render index
    list_html = ""
    for p in posts:
        list_html += f"""
        <article class="blog-preview">
            <span class="muted">{p['display_date']}</span>
            <h2><a href="{p['url']}">{p['title']}</a></h2>
            <p>{p['desc']}</p>
        </article>
        """
        
    index_html = tpl_index.replace('{{POSTS}}', list_html)
    write_file(os.path.join(OUTPUT_DIR, "index.html"), index_html)
    print("Blog build complete.")

if __name__ == "__main__":
    build()