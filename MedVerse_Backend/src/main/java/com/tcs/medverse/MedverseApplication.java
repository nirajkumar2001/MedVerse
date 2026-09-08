package com.tcs.medverse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class MedverseApplication{

//	@Override
//	protected SpringApplicationBuilder configure(SpringApplicationBuilder application){
//		return application.sources(MedverseApplication.class);
//	}
	public static void main(String[] args) {
		SpringApplication.run(MedverseApplication.class, args);
		System.out.println("Application Started");

	}

}
