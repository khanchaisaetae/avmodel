// Small, deliberately illustrative device silhouettes; real sockets remain in the GLTF inspector.
export function deviceArt(id){
 const shapes={
 dell:'<path d="M42 16h116l8 76H34z" fill="#465568"/><path d="M49 23h102l6 61H42z" fill="#bed2da"/><path d="M20 94h160l-17 16H38z" fill="#67778a"/><path d="M61 96h77l-5 5H66z" fill="#a7b3be"/><path d="M54 58l29-23 24 16 35-18v40H49z" fill="#91b5bc"/>',
 bluray:'<path d="M27 40l135-9 23 21-144 12z" fill="#5d6773"/><path d="M41 64l144-12v39L41 105 17 83V54z" fill="#2f3d4d"/><path d="M52 75l94-9v6l-94 9z" fill="#172430"/><circle cx="169" cy="75" r="4" fill="#8cbab7"/><path d="M57 91l34-3" stroke="#99aab7" stroke-width="3"/>',
 vertex:'<path d="M38 93l96-13 35 23-100 17z" fill="#c0c9cf"/><path d="M135 88V35l-37-17H76" fill="none" stroke="#687d8d" stroke-width="10" stroke-linejoin="round"/><path d="M57 13h45v14H57z" fill="#344e60"/><path d="M61 31h34v9H61z" fill="#9db4be"/><path d="M76 92l39-6 21 13-40 6z" fill="#f4f5ee"/><circle cx="144" cy="103" r="3" fill="#188b88"/>',
 epson:'<path d="M25 43l123-11 31 27-124 12z" fill="#f5f6f4"/><path d="M55 71l124-12v40L55 111 23 87V47z" fill="#cbd3d6"/><ellipse cx="145" cy="82" rx="20" ry="18" fill="#526574"/><ellipse cx="145" cy="82" rx="12" ry="11" fill="#9cbac3"/><path d="M66 81l38-4m-38 12l38-4m-38 12l38-4" stroke="#8e9fa7" stroke-width="4"/>',
 tv:'<path d="M25 14h150v87H25z" fill="#3d4c5b"/><path d="M32 21h136v72H32z" fill="#a8c3ca"/><path d="M32 77l41-34 33 20 31-26 31 14v42H32z" fill="#81a7af"/><path d="M94 102h12v12l29 7H66l28-7z" fill="#4d606c"/>'
 };
 return '<svg viewBox="0 0 200 130" aria-hidden="true" focusable="false">'+(shapes[id]||'')+'</svg>';
}
