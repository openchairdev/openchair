type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function Navbar({
  activeTab,
  onTabChange,
}: Props) {
  const tabs = [
    'home',
    'services',
    'staff',
    'reviews',
    'book',
    'contact',
  ];

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl gap-4 px-6 py-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() =>
              onTabChange(tab)
            }
            className={
              activeTab === tab
                ? 'font-bold'
                : ''
            }
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
  );
}