import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { 
  FaTwitter, 
  FaLinkedin, 
  FaGithub, 
  FaDiscord 
} from 'react-icons/fa';

const socialLinks = [
  { icon: FaTwitter, href: "#", label: "Twitter" },
  { icon: FaLinkedin, href: "#", label: "LinkedIn" },
  { icon: FaGithub, href: "#", label: "GitHub" },
  { icon: FaDiscord, href: "#", label: "Discord" }
];

const exploreLinks = [
  { to: "/", text: "首页" },
  { to: "/comparison", text: "比较模型" },
  { to: "/learning", text: "学习资源" }
];

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          {/* 左侧Logo部分 */}
          <div className="mb-6 md:mb-0">
            <Logo theme="light" />
            <p className="mt-2 text-gray-400">拿起您的餐盘，开启AI之旅！</p>
          </div>
          
          {/* 右侧导航部分 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* 探索链接 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">探索</h3>
              <ul className="space-y-2">
                {exploreLinks.map((link) => (
                  <li key={link.text}>
                    <Link 
                      to={link.to} 
                      className="text-gray-400 hover:text-white transition duration-300"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 社交媒体链接 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">关注我们</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="text-gray-400 hover:text-white transition duration-300 text-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <social.icon />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} AI自助餐. 版权所有.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
