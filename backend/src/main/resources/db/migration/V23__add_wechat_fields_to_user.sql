ALTER TABLE `user`
  ADD COLUMN `openid_app1` varchar(64) DEFAULT NULL COMMENT '微信openid',
  ADD COLUMN `unionid` varchar(64) DEFAULT NULL COMMENT '微信unionid';
