import { Github, Bug, FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-display font-bold">
            Desk<span className="text-primary">Note</span>
          </span>
          <span className="text-muted-foreground font-body text-sm">© 2026</span> 
          <span className="text-muted-foreground font-body text-sm">by</span>
          <span className="text-muted-foreground font-body text-sm">Piya Miang-Lae</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/Piya-Boy/DeskNote"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://github.com/Piya-Boy/DeskNote/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <Bug className="h-4 w-4" />
            Report Issue
          </a>
          <a
            href="https://github.com/Piya-Boy/DeskNote/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <FileText className="h-4 w-4" />
            License
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
