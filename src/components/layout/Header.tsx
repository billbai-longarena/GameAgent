import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-gray-800 text-white p-4">
            <div className="container mx-auto">
                <h1 className="text-xl font-bold">GameAgent</h1>
                {/* Navigation links can be added here later */}
            </div>
        </header>
    );
};

export default Header;
