import { ShoppingBag, TriangleAlert } from "lucide-react";
import type { InventoryItem, Product } from "../domain/types";

type Props = {
  inventory: InventoryItem[];
  recommendations: Array<Product & { decisionReason: string; compatible: boolean }>;
};

export function InventoryPanel({ inventory, recommendations }: Props) {
  return (
    <section className="panel commerce-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Commerce trigger</p>
          <h3>库存与推荐</h3>
        </div>
        <ShoppingBag size={20} />
      </div>

      <div className="inventory-list">
        {inventory.map((item) => (
          <div key={item.id} className={item.daysRemaining <= item.reorderThreshold ? "inventory-item low" : "inventory-item"}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.quantity}{item.unit} · 约 {item.daysRemaining} 天</span>
            </div>
            {item.daysRemaining <= item.reorderThreshold && <TriangleAlert size={17} />}
          </div>
        ))}
      </div>

      <div className="recommendations">
        {recommendations.map((product) => (
          <article key={product.id} className="product-card">
            <small>{product.category}</small>
            <strong>{product.title}</strong>
            <p>{product.decisionReason}</p>
            <div>
              <span>¥{product.priceCny}</span>
              <em>{product.caution}</em>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
