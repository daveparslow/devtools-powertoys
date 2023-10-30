// main.ts
import fs from 'fs';
import { CPUProfileNode, PerformanceProfile } from './types';

function filterAndReparentNodes(
  nodes: CPUProfileNode[] | undefined,
  urlIncludes: string[],
): CPUProfileNode[] | undefined {
  if (!nodes) return nodes;

  const idToNodeMap: { [key: number]: CPUProfileNode } = {};
  const filteredNodes: CPUProfileNode[] = [];
  const removedNodeIds: Set<number> = new Set();

  // Create a map of nodes by their id
  for (const node of nodes) {
    idToNodeMap[node.id] = node;
  }

  // Filter out nodes based on the URL and anonymous functions
  for (const node of nodes) {
    const matches = urlIncludes
      .map((url) => node.callFrame.url?.includes(url))
      .reduce((acc, curr) => acc || curr, false);
    const anonymousFunction = isAnonymousFunction(node);
    if (!(matches || anonymousFunction)) {
      filteredNodes.push(node);
      // console.log(
      //   `Keeping node m: ${matches}, a: ${anonymousFunction} ${node.id} (${node.callFrame.functionName}, ${node.callFrame.url}) `
      // );
    } else {
      // console.log(
      //   `x Removing node m: ${matches}, a: ${anonymousFunction} ${node.id} (${node.callFrame.functionName}, ${node.callFrame.url}) `
      // );
      if (node.parent && node.children) {
        const parentNode = idToNodeMap[node.parent];
        if (parentNode) {
          parentNode.children = parentNode.children || [];
          parentNode.children.push(...node.children);
          for (const childId of node.children) {
            const childNode = idToNodeMap[childId];
            if (childNode) {
              childNode.parent = node.parent;
            }
          }
        }
      }
      removedNodeIds.add(node.id);
      delete idToNodeMap[node.id];
    }
  }

  for (const node of filteredNodes) {
    if (node.callFrame.url?.startsWith('http')) {
      node.callFrame.url = `http://localhost:3000/?url=${encodeURI(
        node.callFrame.url,
      )}&lineNumber=${node.callFrame.lineNumber}&columnNumber=${
        node.callFrame.columnNumber
      }&functionName=${encodeURI(node.callFrame.functionName)}&`;
    }
  }

  return filteredNodes;
}

function filterProfileByURL(
  profilePath: string,
  urls: string[],
): PerformanceProfile {
  const rawData = fs.readFileSync(profilePath, 'utf-8');
  const profile: PerformanceProfile = JSON.parse(rawData);

  for (const event of profile.traceEvents) {
    if (event.args?.data?.cpuProfile) {
      event.args.data.cpuProfile.nodes = filterAndReparentNodes(
        event.args.data.cpuProfile.nodes,
        urls,
      );
    }
  }

  return profile;
}

function isAnonymousFunction(_node: CPUProfileNode): boolean {
  return false;
}

function main(traceFilePath: string, urls: string[]) {
  const updatedTrace = filterProfileByURL(traceFilePath, urls);

  fs.writeFileSync('updated-trace.json', JSON.stringify(updatedTrace, null, 2));
  console.log('Updated trace saved to updated-trace.json');
}

const [traceFilePath, urlPatternStrings] = process.argv.slice(2);
if (!traceFilePath || !urlPatternStrings) {
  console.error('Usage: ts-node main.ts <traceFilePath> <url>');
  process.exit(1);
}

main(traceFilePath, urlPatternStrings?.split(','));

// node.callFrame.url = `http://localhost:8000/?url=${encodeURI(
//   node.callFrame.url
// )}&lineNumber=${node.callFrame.lineNumber}&columnNumber=${
//   node.callFrame.columnNumber
// }`;
// let file = filesMap[node.callFrame.url];
// if (!file) {
//   const file = fetch(node.callFrame.url)
//     .then((r) => r.text())
//     .catch((e) => {
//       debugger;
//       return "";
//     });
//   filesMap[node.callFrame.url] = file;
//   filesLinesMap[node.callFrame.url] = file.then((contents) =>
//     contents.split("\n")
//   );
// }
// nodeUpdates.push(
//   filesLinesMap[node.callFrame.url].then((lines) => {
//     nodeUpdatesCompleted++;
//     console.log(
//       `Completed ${nodeUpdatesCompleted} of ${nodeUpdates.length} node updates`
//     );
//     const line = lines[node.callFrame.lineNumber];
//     if (line) {
//       if (line.length < node.callFrame.columnNumber) {
//         console.error(
//           `Line ${node.callFrame.lineNumber} is too short in ${node.callFrame.url} line ${node.callFrame.lineNumber}`
//         );
//       } else {
//         const lineText = line.substring(
//           node.callFrame.columnNumber,
//           node.callFrame.columnNumber + 150
//         );
//         console.log(
//           `(${node.callFrame.functionName}) Line ${node.callFrame.lineNumber} Col: ${node.callFrame.columnNumber} in ${node.callFrame.url} is ${lineText}`
//         );
//       }
//     } else {
//       console.error(
//         `Line ${node.callFrame.lineNumber} not found in ${node.callFrame.url}`
//       );
//     }
//   })
// );
