import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const ComponentTree = ({ nodes }: { nodes: any[] }) => {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <TreeNode key={node.code} node={node} />
      ))}
    </div>
  );
};

const TreeNode = ({ node }: { node: any }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="border rounded-lg p-3">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown size={18} /> : <ChevronRight size={18} />
        ) : (
          <span className="opacity-0 w-[18px]">•</span>
        )}

        <span className="font-medium">
          {node.code} — {node.name}
        </span>

        <span className="text-muted-foreground ml-2">
          qtd: {node.qtd}
        </span>
      </div>

      {open && hasChildren && (
        <div className="ml-6 mt-2 space-y-2">
          {node.children.map((child: any) => (
            <TreeNode key={child.code} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComponentTree;
