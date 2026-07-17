import fs from 'fs'

const docs = JSON.parse(fs.readFileSync('public/data/documents.json', 'utf8'))
const info = JSON.parse(fs.readFileSync('public/data/infographics.json', 'utf8'))

function esc(s) {
  return String(s ?? '').replace(/'/g, "''")
}

function arr(a) {
  const items = (a || []).map((t) => `'${esc(t)}'`).join(',')
  return `ARRAY[${items}]::text[]`
}

let out = '-- Seed data AZTAX (run after schema.sql)\n\n'
out +=
  'insert into public.documents (id,type,category,tags,title,description,thumbnail_url,icon,view_preview_url,direct_download_url,year,featured,popular,created_at) values\n'
out +=
  docs
    .map(
      (d) =>
        `  ('${esc(d.id)}','${esc(d.type)}','${esc(d.category)}',${arr(d.tags)},'${esc(d.title)}','${esc(d.description)}','${esc(d.thumbnail_url)}','${esc(d.icon)}','${esc(d.view_preview_url)}','${esc(d.direct_download_url)}',${d.year},${!!d.featured},${!!d.popular},'${esc(d.created_at)}')`,
    )
    .join(',\n')
out +=
  '\non conflict (id) do update set title=excluded.title, description=excluded.description, tags=excluded.tags, type=excluded.type, category=excluded.category, year=excluded.year, featured=excluded.featured, popular=excluded.popular, view_preview_url=excluded.view_preview_url, direct_download_url=excluded.direct_download_url, icon=excluded.icon;\n\n'
out +=
  'insert into public.infographics (id,title,thumbnail_url,detailed_view_url,direct_download_url,tags,category,year,color) values\n'
out +=
  info
    .map(
      (i) =>
        `  ('${esc(i.id)}','${esc(i.title)}','${esc(i.thumbnail_url)}','${esc(i.detailed_view_url)}','${esc(i.direct_download_url)}',${arr(i.tags)},'${esc(i.category)}',${i.year},'${esc(i.color)}')`,
    )
    .join(',\n')
out +=
  '\non conflict (id) do update set title=excluded.title, tags=excluded.tags, category=excluded.category, year=excluded.year, color=excluded.color, direct_download_url=excluded.direct_download_url;\n'

fs.writeFileSync('supabase/seed.sql', out)
console.log(`seed.sql written: ${docs.length} docs, ${info.length} infographics`)
