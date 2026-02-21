import { Link } from 'react-router-dom';
import { icons } from '../constants.jsx';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 dark:bg-gray-950 text-gray-200 mt-16">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-red-500">{icons.heart}</span>
                            <span className="text-xl font-bold text-white">StayHub24</span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Discover unique stays and unforgettable experiences around the world.
                        </p>
                    </div>

                    {/* Explore Section */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Explore</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                                    Browse Properties
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    Popular Cities
                                </a>
                            </li>
                            <li>
                                <Link to="/wishlist" className="text-gray-400 hover:text-white transition-colors">
                                    Wishlist
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    Special Offers
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Host Section */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">For Hosts</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/add-property" className="text-gray-400 hover:text-white transition-colors">
                                    List Property
                                </Link>
                            </li>
                            <li>
                                <Link to="/earnings" className="text-gray-400 hover:text-white transition-colors">
                                    Earnings
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    Hosting Tips
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Support Section */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Support</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="mailto:support@stayhub24.com" className="text-gray-400 hover:text-white transition-colors">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    Safety & Guidelines
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 pt-8">
                    {/* Social Links */}
                    <div className="flex justify-center space-x-6 mb-6">
                        {icons.facebook && (
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <icons.facebook size={20} />
                            </a>
                        )}
                        {icons.twitter && (
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <icons.twitter size={20} />
                            </a>
                        )}
                        {icons.instagram && (
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <icons.instagram size={20} />
                            </a>
                        )}
                        {icons.linkedin && (
                            <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                <icons.linkedin size={20} />
                            </a>
                        )}
                    </div>

                    {/* Copyright */}
                    <div className="text-center text-gray-400 text-sm">
                        <p>&copy; {currentYear} StayHub24. All rights reserved.</p>
                        <div className="mt-2 space-x-4">
                            <a href="#" className="hover:text-white transition-colors">
                                Terms of Service
                            </a>
                            <span>|</span>
                            <a href="#" className="hover:text-white transition-colors">
                                Privacy Policy
                            </a>
                            <span>|</span>
                            <a href="#" className="hover:text-white transition-colors">
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
