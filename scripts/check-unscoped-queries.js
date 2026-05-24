const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sensitiveTables = ['users','orders','menu_items','tables','restaurants'];
const root = path.resolve(__dirname, '..');

function scanFile(filePath){
  const src = fs.readFileSync(filePath, 'utf8');
  const results = [];
  const regex = /\.from\(\s*['\"](users|orders|menu_items|tables|restaurants)['\"]\s*\)([\s\S]*?);/g;
  let match;
  while((match = regex.exec(src))){
    const table = match[1];
    const snippet = match[2];
    const hasRestaurantEq = /\.eq\(\s*['\"]restaurant_id['\"]\s*,/g.test(snippet);
    const hasRestaurantEqAlt = /\.eq\(\s*['\"]restaurant_id['\"]\s*\)/g.test(snippet);
    if(!hasRestaurantEq){
      // record context lines
      const start = Math.max(0, src.lastIndexOf('\n', match.index)+1);
      const end = Math.min(src.length, match.index + match[0].length);
      const context = src.slice(start, end).split('\n').slice(0,10).join('\n');
      results.push({file: filePath, table, context});
    }
  }
  return results;
}

function main(){
  const files = glob.sync('src/**/*.ts', {cwd: root});
  const all = [];
  files.forEach(f => {
    const fp = path.join(root, f);
    try{
      const r = scanFile(fp);
      if(r.length) all.push(...r);
    }catch(e){
      console.error('err', fp, e.message);
    }
  });
  if(all.length===0){
    console.log('No suspicious unscoped queries detected.');
    process.exit(0);
  }
  console.log('Suspicious queries (no restaurant_id filter in same statement):');
  all.forEach(a =>{
    console.log('\n---\nFile:', a.file, '\nTable:', a.table, '\nContext:\n', a.context);
  });
  process.exit(1);
}

main();
