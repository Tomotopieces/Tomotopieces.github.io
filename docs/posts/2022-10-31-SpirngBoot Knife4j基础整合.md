---
title: "SpirngBoot Knife4j基础整合"
date: '2022-10-31'
tags: ["java"]
---
SpringBoot中对Swagger2拓展工具Knife4j的基础整合

本篇内容暂时还在完善

## 步骤

1.  _pom.xml_ 添加依赖
```xml
<!-- Knife4j -->
<dependency>
	<groupId>com.github.xiaoymin</groupId>
	<artifactId>knife4j-spring-boot-starter</artifactId>
	<version>2.0.9</version>
</dependency>
```

    - 其中已包含所有所需的Swagger依赖，不需要另外添加
    - 3.0.3版本暂时没有理清依赖关系与配置方式，暂不使用

2.  添加配置文件 _Knife4jConfig.java_
```java
package com.wenhong.data.config;

import com.github.xiaoymin.knife4j.spring.annotations.EnableKnife4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.Contact;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

import java.util.ArrayList;

/**
* Knife4j Swagger 配置类
*
* @author Tomoto
* @version 1.0
* @since 2022/10/31 16:24
*/
@Configuration
@EnableKnife4j
@EnableSwagger2
public class Knife4jConfig {
	private static final String TITLE = "";
	private static final String DESCRIPTION = "";
	private static final String VERSION = "0.1";
	private static final String AUTHOR = "";
	private static final String URL = "";
	private static final String EMAIL = "";

	@Bean
	public Docket docket(Environment environment) {
		return new Docket(DocumentationType.SWAGGER_2)
				.apiInfo(apiInfo())
				//是否启动swagger 默认启动
				.enable(true)
				//所在分组
				.groupName("master")
				.select()
				//指定扫描的包路径
				.apis(RequestHandlerSelectors.basePackage("xxx.xxx.controller"))
				.paths(PathSelectors.any())
				.build();
	}

	private ApiInfo apiInfo() {
		Contact contact = new Contact(AUTHOR, URL, EMAIL);
		return new ApiInfo(
				TITLE,
				DESCRIPTION,
				VERSION,
				"",
				contact,
				"",
				"",
				new ArrayList<>()
		);

	}
}
```
    
3.  至此已经完整整合，可以通过地址`address:port/doc.html`来访问文档页面
