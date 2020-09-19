const fs = require('fs');
const glob = require('glob');
const shell = require('shelljs');

const getProjectTsFiles = () =>
  new Promise((resolve, reject) => {
    glob('./!(node_modules)/**/*.{ts,tsx}', function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

const readFile = path =>
  new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

const writeFile = (path, content) =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, content, function (err) {
      if (err) return reject(err);
      else resolve();
    });
  });

const jsifyFile = async (path, addToGit = true) => {
  // todo something better?
  const jsFileName = path.replace('.ts', '.js');

  const jsContents = await readFile(jsFileName);
  if (jsContents) {
    await writeFile(path, jsContents);
    if (addToGit) {
      shell.exec(`git mv ${path} ${jsFileName} -f`);
    } else {
      await deleteFile(path);
    }
    console.log('transpiled', path);
  } else {
    await deleteFile(path);
    await deleteFile(jsFileName);
    console.log('deleted', path);
  }
};

const deleteFile = path =>
  new Promise((resolve, reject) => {
    fs.unlink(path, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const normalize = async () => {
  shell.exec('npx tsc');
  const typeScriptFilesInProject = await getProjectTsFiles();
  const tasks = typeScriptFilesInProject.map(jsifyFile);
  await Promise.all(tasks);
};

(async function () {
  await normalize();
})();
