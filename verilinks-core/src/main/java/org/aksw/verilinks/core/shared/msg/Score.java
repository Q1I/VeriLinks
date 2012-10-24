package org.aksw.verilinks.core.shared.msg;

public class Score {
	private String name =null;
	private String id = null;
	private int score = 0;
	
	public Score(String name, String id , int score){
		this.name=name;
		this.id=null;
		this.score = score;
	
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public int getScore() {
		return score;
	}

	public void setScore(int score) {
		this.score = score;
	}

}