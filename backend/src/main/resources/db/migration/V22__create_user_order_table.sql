CREATE TABLE user_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  out_trade_no VARCHAR(32) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  description VARCHAR(128) NOT NULL,
  member_type VARCHAR(16) NOT NULL,
  period_months INT NOT NULL,
  amount INT NOT NULL,
  time_expire DATETIME NOT NULL,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pay_time DATETIME,
  pay_type VARCHAR(16) NOT NULL,
  pay_status VARCHAR(16) NOT NULL,
  mchid VARCHAR(32) NOT NULL,
  appid VARCHAR(32) NOT NULL,
  transaction_id VARCHAR(64),
  code_url VARCHAR(256),
  INDEX idx_user_id(user_id)
); 