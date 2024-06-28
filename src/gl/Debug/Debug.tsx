import { useFrame } from "@react-three/fiber";

const output = document.createElement('div');
document.body.appendChild(output);
output.style.position = 'absolute';
output.style.top = '0';
output.style.left = '0';
output.style.color = 'white';
output.style.fontSize = '20px';
output.style.zIndex = '1000';
output.style.backgroundColor = 'rgba(0, 0, 0, 1)';

const Debug = () => {
  useFrame(() => {
    output.innerText = window.debug ?? '';
  })
}

export default Debug;