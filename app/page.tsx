import SkinViewer from "@/components/SkinViewer";

export default function Home() {
  return (
    <div>
      <div className="navbar">
        <p>MC Skin Editor</p>

        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#">Gallery</a>
        </div>
      </div>

      <div className="windows">
        <div className="skinWindow">
          <SkinViewer />
        </div>

        <div className="editorWindow">
          <h3>Editor Tools</h3>
        </div>
      </div>
    </div>
  );
}