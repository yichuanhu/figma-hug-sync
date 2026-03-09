import optionA from '@/assets/empty-state-option-a.png';
import optionB from '@/assets/empty-state-option-b.png';
import optionC from '@/assets/empty-state-option-c.png';

const EmptyStateOptionsPreview = () => {
  return (
    <div style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 48, alignItems: 'center', background: '#fff', minHeight: '100vh', overflow: 'auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1C1F23' }}>缺省图方案预览 — Figma 风格</h1>
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: '方案 A — 文件夹文档', src: optionA, desc: '灰色线条文件夹 + 文档露出 + 黄色圆点点缀' },
          { label: '方案 B — 搜索放大镜', src: optionB, desc: '灰色线条放大镜 + 问号 + 黄色圆点' },
          { label: '方案 C — 空收件箱', src: optionC, desc: '灰色线条打开的盒子 + 黄色浮动圆点' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 280, height: 280, border: '1px solid #E5E5E5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
              <img src={item.src} alt={item.label} style={{ width: 180, height: 180, objectFit: 'contain' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1C1F23' }}>{item.label}</div>
              <div style={{ fontSize: 13, color: '#86909C', marginTop: 4 }}>{item.desc}</div>
            </div>
            {/* 模拟实际使用场景 */}
            <div style={{ width: 280, border: '1px solid #E5E5E5', borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#fff' }}>
              <img src={item.src} alt="" style={{ width: 120, height: 120, objectFit: 'contain' }} />
              <div style={{ fontSize: 14, color: '#86909C' }}>暂无数据</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmptyStateOptionsPreview;
