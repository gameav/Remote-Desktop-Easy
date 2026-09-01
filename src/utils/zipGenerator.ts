import JSZip from 'jszip';
import { CODE_FILES } from '../data/codeFiles';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Host folder
  const hostFolder = zip.folder('host');
  const windowsHost = CODE_FILES.find((f) => f.id === 'windows_host')?.content || '';
  const reqs = CODE_FILES.find((f) => f.id === 'requirements')?.content || '';
  const bat = CODE_FILES.find((f) => f.id === 'batch_script')?.content || '';

  hostFolder?.file('windows_host.py', windowsHost);
  hostFolder?.file('requirements.txt', reqs);
  hostFolder?.file('run_host.bat', bat);

  // Signaling folder
  const signalingFolder = zip.folder('signaling');
  const sigNode = CODE_FILES.find((f) => f.id === 'signaling_node')?.content || '';
  const sigPy = CODE_FILES.find((f) => f.id === 'signaling_python')?.content || '';
  signalingFolder?.file('signaling_server.js', sigNode);
  signalingFolder?.file('signaling_server.py', sigPy);
  signalingFolder?.file('package.json', JSON.stringify({
    name: 'webrtc-signaling-server',
    version: '1.0.0',
    main: 'signaling_server.js',
    scripts: { start: 'node signaling_server.js' },
    dependencies: { express: '^4.21.2', ws: '^8.18.0' }
  }, null, 2));

  // Client folder
  const clientFolder = zip.folder('client');
  const clientHtml = CODE_FILES.find((f) => f.id === 'client_html')?.content || '';
  clientFolder?.file('index.html', clientHtml);

  // Root README
  zip.file('README.md', `# WebRTC Low-Latency Remote Desktop for CAD

## Quickstart Guide

### 1. Start the Signaling Server
\`\`\`bash
cd signaling
npm install
node signaling_server.js 3000
# OR if using pure Python:
# python signaling_server.py --port 3000
\`\`\`

### 2. Start the Windows Host Streamer
On your Windows 10 Host machine:
\`\`\`bat
cd host
run_host.bat
# or manually:
pip install -r requirements.txt
python windows_host.py --signaling http://localhost:3000 --fps 30
\`\`\`

### 3. Open on iPhone Safari
1. Connect iPhone and PC to the same Tailscale network (e.g. Tailscale IP: 100.x.y.z).
2. Open Safari on iPhone and navigate to:
   \`http://100.x.y.z:3000\`
3. Add to Home Screen for fullscreen CAD experience without browser chrome.
4. Interact using Direct Screen Touch or CAD Virtual Trackpad mode!
`);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'webrtc-remote-desktop-cad.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
